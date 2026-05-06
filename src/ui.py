def format_currency(value):

    try:
        if isinstance(value, int):
            reais = value / 100.0
        else:
            reais = float(value)
        return f"{reais:.2f}"
    except Exception:
        return str(value)


def level_payload(greed_game):
    if greed_game is None:
        return {}
    return greed_game.to_json()
