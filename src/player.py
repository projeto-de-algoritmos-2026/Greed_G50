def parse_choice(choice):

    parsed = {}
    if not isinstance(choice, dict):
        return parsed
    for k, v in choice.items():
        try:
            coin = float(k)
            key = f"{coin:.2f}"
            parsed[key] = int(v)
        except Exception:
            continue
    return parsed


class Player:
    def __init__(self, name=None):
        self.name = name

    def submit_choice(self, raw_choice):
        return parse_choice(raw_choice)