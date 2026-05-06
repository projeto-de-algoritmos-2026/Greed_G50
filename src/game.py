class GreedGame:
    def __init__(self, amount=93, coins=None, available=None):
        if coins is None:
            coins = [0.25, 0.10, 0.05, 0.01]

        def to_cents(x):
            return int(round(float(x) * 100))

        self.original_coins = [float(c) for c in coins]
        self.coins = sorted([to_cents(c) for c in coins], reverse=True)
        self.amount = to_cents(amount)
        min_coin = min(self.coins) if self.coins else 1
        max_needed = (self.amount // min_coin) + 10
        self.available = {}
        if available is None:
            for c in self.coins:
                self.available[c] = max_needed
        else:
            for orig, c in zip(self.original_coins, self.coins):
                v = available.get(orig) if isinstance(available, dict) else None
                if v is None:
                    v = available.get(str(orig)) if isinstance(available, dict) else None
                try:
                    v = int(v)
                except Exception:
                    v = None
                if v is None or v < 0:
                    v = max_needed
                self.available[c] = v

    def greedy_change(self, amount=None):
        if amount is None:
            amount = self.amount
        remaining = amount
        used = {c: 0 for c in self.coins}
        total = 0
        for c in self.coins:
            can = self.available.get(c, 0)
            take = min(remaining // c, can)
            used[c] = take
            total += take
            remaining -= take * c
        if remaining != 0:
            return used, None
        return used, total

    def optimal_bounded_change(self, amount=None):
        if amount is None:
            amount = self.amount
        INF = 10 ** 9
        dp = [INF] * (amount + 1)
        prev = [None] * (amount + 1)
        dp[0] = 0
        for c in self.coins:
            count = self.available.get(c, 0)
            power = 1
            while count > 0:
                take = min(power, count)
                w = take * c
                for v in range(amount, w - 1, -1):
                    if dp[v - w] + take < dp[v]:
                        dp[v] = dp[v - w] + take
                        prev[v] = (v - w, c, take)
                count -= take
                power <<= 1
        if dp[amount] >= INF:
            return None, {}
        v = amount
        sol = {c: 0 for c in self.coins}
        while v != 0:
            p = prev[v]
            if p is None:
                break
            pv, c, take = p
            sol[c] += take
            v = pv
        return dp[amount], sol

    def validate_player(self, player_choice):
        used = {}
        for key, val in (player_choice.items() if isinstance(player_choice, dict) else []):
            try:
                coin_val = float(key)
                coin_cents = int(round(coin_val * 100))
            except Exception:
                continue
            used[coin_cents] = int(val)
        for c in self.coins:
            if c not in used:
                used[c] = 0
        unknown = [c for c in used.keys() if c not in self.coins and used.get(c, 0) > 0]
        if unknown:
            uc = unknown[0]
            return {"valid": False, "reason": "unknown_coin", "message": f"Moeda desconhecida: {uc/100:.2f}"}
        for c in self.coins:
            cnt = used.get(c, 0)
            if cnt < 0 or cnt > self.available.get(c, 0):
                return {"valid": False, "reason": "invalid_count", "message": f"Quantidade inválida para {c/100:.2f}"}
        total_value = sum(c * used[c] for c in self.coins)
        if total_value != self.amount:
            return {"valid": False, "reason": "wrong_sum", "message": f"Soma incorreta: {total_value/100:.2f} != {self.amount/100:.2f}", "total": total_value/100}
        player_total = sum(used[c] for c in self.coins)
        greedy_used, greedy_total = self.greedy_change()
        optimal_total, optimal_sol = self.optimal_bounded_change()
        def readable(sol):
            return {f"{c/100:.2f}": cnt for c, cnt in sol.items()}
        result = {
            "valid": True,
            "player_used": readable(used),
            "player_total": player_total,
            "greedy_used": readable(greedy_used),
            "greedy_total": (None if greedy_total is None else greedy_total),
            "optimal_total": optimal_total,
            "optimal_used": readable(optimal_sol),
            "is_optimal": (optimal_total is not None and player_total == optimal_total),
        }
        return result

    def to_json(self):
        greedy_used, greedy_total = self.greedy_change()
        optimal_total, optimal_used = self.optimal_bounded_change()
        coins_f = [c / 100.0 for c in self.coins]
        avail_f = {f"{c/100:.2f}": self.available[c] for c in self.coins}
        def readable(sol):
            return {f"{c/100:.2f}": cnt for c, cnt in sol.items()}
        return {
            "amount": self.amount / 100.0,
            "coins": coins_f,
            "available": avail_f,
            "greedy_used": readable(greedy_used),
            "greedy_total": greedy_total,
            "optimal_total": optimal_total,
            "optimal_used": readable(optimal_used),
        }
