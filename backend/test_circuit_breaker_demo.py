"""
Circuit Breaker Demo Script

Demonstrates the circuit breaker pattern with visual output.
"""

import time
from app.services.ai.circuit_breaker import CircuitBreaker, CircuitState

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
CYAN = '\033[96m'
RESET = '\033[0m'
BOLD = '\033[1m'


def print_header(text):
    """Print formatted header"""
    print(f"\n{BOLD}{BLUE}{'='*70}{RESET}")
    print(f"{BOLD}{BLUE}{text.center(70)}{RESET}")
    print(f"{BOLD}{BLUE}{'='*70}{RESET}\n")


def print_state(cb: CircuitBreaker):
    """Print current circuit breaker state"""
    state_colors = {
        CircuitState.CLOSED: GREEN,
        CircuitState.OPEN: RED,
        CircuitState.HALF_OPEN: YELLOW
    }
    color = state_colors.get(cb.state, RESET)
    
    print(f"{color}State: {cb.state.value.upper()}{RESET}")
    print(f"Failures: {cb.failure_count}/{cb.failure_threshold}")
    if cb.state == CircuitState.HALF_OPEN:
        print(f"Successes: {cb.success_count}/{cb.success_threshold}")


def demo_basic_operation():
    """Demo 1: Basic circuit breaker operation"""
    print_header("DEMO 1: Basic Circuit Breaker Operation")
    
    cb = CircuitBreaker("demo-provider", failure_threshold=3, timeout_duration=2)
    
    print(f"{CYAN}Initial state:{RESET}")
    print_state(cb)
    
    print(f"\n{CYAN}Recording 2 failures (below threshold):{RESET}")
    cb.record_failure()
    cb.record_failure()
    print_state(cb)
    
    print(f"\n{CYAN}Recording 1 more failure (reaches threshold):{RESET}")
    cb.record_failure()
    print_state(cb)
    
    print(f"\n{CYAN}Attempting request (should be blocked):{RESET}")
    can_request = cb.can_request()
    print(f"Can request: {GREEN if can_request else RED}{can_request}{RESET}")


def demo_recovery_cycle():
    """Demo 2: Complete recovery cycle"""
    print_header("DEMO 2: Complete Recovery Cycle")
    
    cb = CircuitBreaker("demo-provider", failure_threshold=2, timeout_duration=2)
    
    print(f"{CYAN}Step 1: Open the circuit with failures{RESET}")
    cb.record_failure()
    cb.record_failure()
    print_state(cb)
    
    print(f"\n{CYAN}Step 2: Wait for timeout (2 seconds)...{RESET}")
    for i in range(2):
        time.sleep(1)
        print(f"  Waiting... {i+1}s")
    
    print(f"\n{CYAN}Step 3: Attempt request (transitions to HALF_OPEN){RESET}")
    can_request = cb.can_request()
    print(f"Can request: {GREEN if can_request else RED}{can_request}{RESET}")
    print_state(cb)
    
    print(f"\n{CYAN}Step 4: Successful test request (closes circuit){RESET}")
    cb.record_success()
    print_state(cb)


def demo_failed_recovery():
    """Demo 3: Failed recovery attempt"""
    print_header("DEMO 3: Failed Recovery Attempt")
    
    cb = CircuitBreaker("demo-provider", failure_threshold=2, timeout_duration=2)
    
    print(f"{CYAN}Step 1: Open the circuit{RESET}")
    cb.record_failure()
    cb.record_failure()
    print_state(cb)
    
    print(f"\n{CYAN}Step 2: Wait for timeout (2 seconds)...{RESET}")
    time.sleep(2.1)
    
    print(f"\n{CYAN}Step 3: Transition to HALF_OPEN{RESET}")
    cb.can_request()
    print_state(cb)
    
    print(f"\n{CYAN}Step 4: Failed test request (reopens circuit){RESET}")
    cb.record_failure()
    print_state(cb)


def demo_multiple_successes():
    """Demo 4: Multiple successes required"""
    print_header("DEMO 4: Multiple Successes Required")
    
    cb = CircuitBreaker(
        "demo-provider",
        failure_threshold=2,
        timeout_duration=1,
        success_threshold=3
    )
    
    print(f"{CYAN}Configuration:{RESET}")
    print(f"  Failure threshold: {cb.failure_threshold}")
    print(f"  Success threshold: {cb.success_threshold}")
    print(f"  Timeout: {cb.timeout_duration}s")
    
    print(f"\n{CYAN}Step 1: Open the circuit{RESET}")
    cb.record_failure()
    cb.record_failure()
    print_state(cb)
    
    print(f"\n{CYAN}Step 2: Wait and transition to HALF_OPEN{RESET}")
    time.sleep(1.1)
    cb.can_request()
    print_state(cb)
    
    print(f"\n{CYAN}Step 3: Record successes (need 3 to close){RESET}")
    for i in range(3):
        cb.record_success()
        print(f"\n  After success {i+1}:")
        print_state(cb)


def demo_status_reporting():
    """Demo 5: Status reporting"""
    print_header("DEMO 5: Status Reporting")
    
    cb = CircuitBreaker("demo-provider", failure_threshold=3, timeout_duration=5)
    
    print(f"{CYAN}Status in CLOSED state:{RESET}")
    status = cb.get_status()
    for key, value in status.items():
        print(f"  {key}: {value}")
    
    print(f"\n{CYAN}Opening circuit...{RESET}")
    for i in range(3):
        cb.record_failure()
    
    print(f"\n{CYAN}Status in OPEN state:{RESET}")
    status = cb.get_status()
    for key, value in status.items():
        print(f"  {key}: {value}")


def demo_manual_reset():
    """Demo 6: Manual reset"""
    print_header("DEMO 6: Manual Reset")
    
    cb = CircuitBreaker("demo-provider", failure_threshold=2)
    
    print(f"{CYAN}Step 1: Open the circuit{RESET}")
    cb.record_failure()
    cb.record_failure()
    print_state(cb)
    
    print(f"\n{CYAN}Step 2: Manual reset{RESET}")
    cb.reset()
    print_state(cb)
    
    print(f"\n{CYAN}Circuit is now ready for requests{RESET}")
    can_request = cb.can_request()
    print(f"Can request: {GREEN if can_request else RED}{can_request}{RESET}")


def main():
    """Run all demos"""
    print(f"\n{BOLD}{CYAN}{'='*70}{RESET}")
    print(f"{BOLD}{CYAN}{'CIRCUIT BREAKER PATTERN DEMONSTRATION'.center(70)}{RESET}")
    print(f"{BOLD}{CYAN}{'='*70}{RESET}\n")
    
    demos = [
        demo_basic_operation,
        demo_recovery_cycle,
        demo_failed_recovery,
        demo_multiple_successes,
        demo_status_reporting,
        demo_manual_reset
    ]
    
    for demo in demos:
        demo()
        input(f"\n{YELLOW}Press Enter to continue to next demo...{RESET}")
    
    print(f"\n{BOLD}{GREEN}{'='*70}{RESET}")
    print(f"{BOLD}{GREEN}{'ALL DEMOS COMPLETE!'.center(70)}{RESET}")
    print(f"{BOLD}{GREEN}{'='*70}{RESET}\n")
    
    print(f"{CYAN}Key Takeaways:{RESET}")
    print(f"  • Circuit opens after {BOLD}failure threshold{RESET} failures")
    print(f"  • Circuit stays open for {BOLD}timeout duration{RESET}")
    print(f"  • Circuit transitions to {BOLD}HALF_OPEN{RESET} to test recovery")
    print(f"  • Circuit closes after {BOLD}success threshold{RESET} successes")
    print(f"  • Manual reset available for administrative control")


if __name__ == "__main__":
    main()
