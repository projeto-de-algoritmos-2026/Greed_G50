
# Greed — Jogo do Troco

Este repositório contém uma implementação didática do jogo "Greed" (troco). O objetivo é formar um valor usando moedas, comparando sua solução com a solução gulosa e com a solução ótima (quando disponível).

**Principais tópicos nesta versão**
- Backend: Flask (API  em `app.py`)
- Lógica do jogo: `src/game.py`, `src/player.py`, `src/ui.py`
- Frontend: módulos ES em `static/js/` e templates em `templates/`


**Requisitos**
- Python 3.10+ (ambiente virtual recomendado)
- Dependências listadas em `requirements.txt`

## Instalação rápida

Windows (PowerShell):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Executar a aplicação

```powershell
python app.py
```

Abra no navegador: http://127.0.0.1:5000


## Seção para screenshots

![Jogo em andamento](docs/img/screen-game.png)
![Tela inicial](docs/img/screen-index.png)





