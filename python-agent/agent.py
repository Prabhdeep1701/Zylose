#!/usr/bin/env python3
"""
SentinelAI Python Agent
=======================
Collects system telemetry (CPU, Memory, Processes, Network)
and sends it to the SentinelAI backend every N seconds.

Run: python agent.py [--interval 5] [--endpoint http://localhost:3000]
"""

import os
import sys
import json
import time
import uuid
import socket
import logging
import argparse
import threading
from datetime import datetime, timezone

try:
    import psutil
except ImportError:
    print("[ERROR] psutil not installed. Run: pip install psutil requests")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("[ERROR] requests not installed. Run: pip install psutil requests")
    sys.exit(1)

# ──────────────────────────────────────────────────────────────
# Logging setup
# ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("SentinelAgent")

# The agent's stable-across-restarts identity
AGENT_ID = os.environ.get("SENTINEL_AGENT_ID") or str(uuid.uuid4())
HOSTNAME = socket.gethostname()


# ──────────────────────────────────────────────────────────────
# Collectors
# ──────────────────────────────────────────────────────────────

def collect_cpu() -> dict:
    """Collect CPU metrics."""
    per_core = psutil.cpu_percent(percpu=True, interval=0.5)
    return {
        "usage_pct":     psutil.cpu_percent(interval=None),
        "core_count":    psutil.cpu_count(logical=True),
        "physical_cores": psutil.cpu_count(logical=False),
        "per_core":      per_core,
        "load_avg_1m":   psutil.getloadavg()[0] if hasattr(psutil, "getloadavg") else None,
        "freq_mhz":      psutil.cpu_freq().current if psutil.cpu_freq() else None,
    }


def collect_memory() -> dict:
    """Collect memory metrics."""
    vm = psutil.virtual_memory()
    swap = psutil.swap_memory()
    return {
        "total_gb":      round(vm.total         / 1024**3, 2),
        "used_gb":       round(vm.used          / 1024**3, 2),
        "available_gb":  round(vm.available     / 1024**3, 2),
        "usage_pct":     vm.percent,
        "swap_total_gb": round(swap.total       / 1024**3, 2),
        "swap_used_gb":  round(swap.used        / 1024**3, 2),
        "swap_pct":      swap.percent,
    }


def collect_processes(top_n: int = 20) -> list:
    """Collect top N processes by CPU usage."""
    procs = []
    for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info", "status", "username"]):
        try:
            info = proc.info
            procs.append({
                "pid":        info["pid"],
                "name":       info["name"],
                "cpu_pct":    info["cpu_percent"],
                "memory_mb":  round(info["memory_info"].rss / 1024**2, 1) if info["memory_info"] else 0,
                "status":     info["status"],
                "username":   info.get("username", ""),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    # Sort by CPU descending, return top N
    procs.sort(key=lambda p: p["cpu_pct"], reverse=True)
    return procs[:top_n]


def collect_network() -> dict:
    """Collect network I/O and active connections."""
    io = psutil.net_io_counters()
    connections = []
    try:
        for conn in psutil.net_connections(kind="inet"):
            if conn.status == psutil.CONN_ESTABLISHED:
                connections.append({
                    "laddr": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else "",
                    "raddr": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else "",
                    "status": conn.status,
                    "type":   "TCP" if conn.type == socket.SOCK_STREAM else "UDP",
                })
    except (psutil.AccessDenied, PermissionError):
        log.debug("Insufficient permissions to enumerate all connections")

    return {
        "bytes_sent":       io.bytes_sent,
        "bytes_recv":       io.bytes_recv,
        "packets_sent":     io.packets_sent,
        "packets_recv":     io.packets_recv,
        "err_in":           io.errin,
        "err_out":          io.errout,
        "drop_in":          io.dropin,
        "drop_out":         io.dropout,
        "active_connections": len(connections),
        "connections":      connections[:20],  # cap at 20 to keep payload small
    }


def collect_disk() -> dict:
    """Collect disk usage for the root partition."""
    disk = psutil.disk_usage("/")
    io = psutil.disk_io_counters()
    return {
        "total_gb":   round(disk.total   / 1024**3, 2),
        "used_gb":    round(disk.used    / 1024**3, 2),
        "free_gb":    round(disk.free    / 1024**3, 2),
        "usage_pct":  disk.percent,
        "reads":      io.read_count  if io else None,
        "writes":     io.write_count if io else None,
        "read_mb":    round(io.read_bytes  / 1024**2, 1) if io else None,
        "write_mb":   round(io.write_bytes / 1024**2, 1) if io else None,
    }


# ──────────────────────────────────────────────────────────────
# ML-lite: Statistical anomaly detection
# ──────────────────────────────────────────────────────────────

_history: list[float] = []

def isolation_score(value: float, window: list[float]) -> float:
    """Lightweight z-score based anomaly scoring (0–1)."""
    if len(window) < 3:
        return 0.0
    mean = sum(window) / len(window)
    variance = sum((x - mean) ** 2 for x in window) / len(window)
    std = variance ** 0.5 or 1e-6
    z = abs(value - mean) / std
    return min(1 / (1 + 2.718 ** (-z + 2)), 1.0)


def compute_risk_score(cpu_pct: float, mem_pct: float, conn_count: int) -> int:
    """
    Combine multiple metrics into a single 0–100 risk score.
    Uses DSA sliding window + ML-style isolation scoring.
    """
    global _history
    _history.append(cpu_pct)
    if len(_history) > 30:
        _history.pop(0)

    cpu_anomaly = isolation_score(cpu_pct, _history)
    mem_score   = min(mem_pct / 100.0, 1.0)
    net_anomaly = min(conn_count / 1000.0, 1.0)

    risk = (cpu_anomaly * 0.5 + mem_score * 0.3 + net_anomaly * 0.2) * 100
    return int(min(risk, 100))


# ──────────────────────────────────────────────────────────────
# Main telemetry send
# ──────────────────────────────────────────────────────────────

def build_payload() -> dict:
    """Gather all telemetry metrics and build the JSON payload."""
    cpu  = collect_cpu()
    mem  = collect_memory()
    net  = collect_network()
    disk = collect_disk()
    procs = collect_processes(top_n=15)

    risk_score = compute_risk_score(
        cpu_pct=cpu["usage_pct"],
        mem_pct=mem["usage_pct"],
        conn_count=net["active_connections"],
    )

    return {
        "agentId":    AGENT_ID,
        "hostname":   HOSTNAME,
        "timestamp":  datetime.now(timezone.utc).isoformat(),
        "riskScore":  risk_score,
        "cpu":        cpu,
        "memory":     mem,
        "network":    net,
        "disk":       disk,
        "processes":  procs,
    }


def send_telemetry(endpoint: str, payload: dict, timeout: int = 10) -> bool:
    """POST telemetry to the backend API."""
    try:
        resp = requests.post(
            f"{endpoint}/api/agent",
            json=payload,
            timeout=timeout,
            headers={"Content-Type": "application/json", "X-Agent-ID": AGENT_ID},
        )
        if resp.status_code in (200, 201):
            log.info(f"✓ Telemetry sent | risk={payload['riskScore']} cpu={payload['cpu']['usage_pct']}% mem={payload['memory']['usage_pct']}%")
            return True
        else:
            log.warning(f"✗ Backend returned {resp.status_code}: {resp.text[:200]}")
            return False
    except requests.Timeout:
        log.error("Connection to backend timed out")
    except requests.ConnectionError as e:
        log.error(f"Connection error: {e}")
    except Exception as e:
        log.exception(f"Unexpected error: {e}")
    return False


def send_log_entry(endpoint: str, level: str, service: str, message: str) -> None:
    """Helper to push a log entry to /api/logs."""
    try:
        requests.post(
            f"{endpoint}/api/logs",
            json={"level": level, "service": service, "message": message},
            timeout=5,
        )
    except Exception:
        pass


# ──────────────────────────────────────────────────────────────
# Run loop
# ──────────────────────────────────────────────────────────────

def run(interval: int, endpoint: str) -> None:
    log.info(f"SentinelAI Agent starting — ID: {AGENT_ID}")
    log.info(f"Backend: {endpoint} | Interval: {interval}s | Host: {HOSTNAME}")

    # Notify backend that agent has started
    send_log_entry(endpoint, "INFO", "SentinelAgent", f"Agent started on host {HOSTNAME} (id={AGENT_ID})")

    consecutive_failures = 0
    MAX_FAILURES = 5

    while True:
        try:
            payload = build_payload()

            # High-risk alert: also log to /api/logs
            if payload["riskScore"] >= 75:
                send_log_entry(
                    endpoint, "WARN", "SentinelAgent",
                    f"HIGH RISK SCORE {payload['riskScore']} — CPU:{payload['cpu']['usage_pct']}% MEM:{payload['memory']['usage_pct']}%"
                )

            success = send_telemetry(endpoint, payload)
            consecutive_failures = 0 if success else consecutive_failures + 1

            if consecutive_failures >= MAX_FAILURES:
                log.error(f"{MAX_FAILURES} consecutive failures — check backend connectivity")
                consecutive_failures = 0

        except Exception as e:
            log.exception(f"Unhandled exception in collection loop: {e}")

        time.sleep(interval)


# ──────────────────────────────────────────────────────────────
# CLI entry point
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SentinelAI System Telemetry Agent")
    parser.add_argument("--interval", type=int,   default=5,
                        help="Collection interval in seconds (default: 5)")
    parser.add_argument("--endpoint", type=str,   default="http://localhost:3000",
                        help="SentinelAI backend URL (default: http://localhost:3000)")
    parser.add_argument("--dry-run",  action="store_true",
                        help="Collect and print one payload without sending")
    args = parser.parse_args()

    if args.dry_run:
        payload = build_payload()
        print(json.dumps(payload, indent=2))
        sys.exit(0)

    try:
        run(interval=args.interval, endpoint=args.endpoint)
    except KeyboardInterrupt:
        log.info("Agent stopped by user (Ctrl+C)")
        sys.exit(0)
