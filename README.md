# LinkedInECS

Este projeto combina uma extensão do Chrome e um parser em Python para capturar páginas do LinkedIn em HTML e depois converter esses arquivos em texto legível.

## Visão geral

A ideia é simples:

1. A extensão abre a página atual, tenta expandir conteúdos como "Show more" e salva o HTML completo em um arquivo.
2. O parser fica observando a pasta de downloads do sistema.
3. Quando chega um arquivo `.html`, ele extrai o texto puro e salva em uma pasta de saída como `.txt`.

Esse fluxo é útil para guardar conteúdo de perfis, publicações ou páginas do LinkedIn em um formato mais fácil de processar ou consultar.

---

## Como funciona

### 1) Extensão do navegador
A extensão está localizada na pasta [Extension](Extension/).

Ela:
- injeta um script na página atual;
- clica em botões/links como "Read more", "Show more" e "View more" quando identificados;
- espera a página carregar o conteúdo expandido;
- salva o HTML completo como arquivo no download.

Além disso, a extensão também permite cadastrar "snippets" (trechos de texto) para inserir rapidamente em campos editáveis da página.

### 2) Parser em Python
O parser está em [Parser/watch_and_extract.py](Parser/watch_and_extract.py).

Ele usa:
- `watchdog` para monitorar mudanças na pasta de downloads;
- `BeautifulSoup` para ler o HTML e limpar tags que não são texto;
- `pathlib` para criar e salvar os arquivos de saída.

Quando um novo arquivo `.html` aparece na pasta `Downloads`, o parser cria um arquivo `.txt` com o mesmo nome na pasta `Downloads/extracted_text`.

---

## Estrutura do projeto

```text
linkedinProject/
├── README.md
├── Extension/
│   ├── content.js
│   ├── manifest.json
│   ├── options.html
│   ├── options.js
│   ├── popup.html
│   └── popup.js
├── Parser/
│   ├── requirements.txt
│   ├── watch_and_extract.py
│   └── Downloads/
│       ├── ... arquivos .html
│       └── extracted_text/
│           └── ... arquivos .txt
└── ...
```

---

## Pré-requisitos

Antes de usar o projeto, você precisa ter:

- Google Chrome ou Chromium
- Python 3 instalado
- acesso à pasta de Downloads do sistema

---

## Instalação da extensão

### Passo a passo

1. Abra o Chrome e acesse:
   ```text
   chrome://extensions
   ```
2. Ative o modo "Developer mode" (no canto superior direito).
3. Clique em "Load unpacked".
4. Selecione a pasta [Extension](Extension/).
5. A extensão será instalada e aparecerá na barra de extensão.

### Como usar a extensão

1. Abra uma página do LinkedIn que você deseja salvar.
2. Clique na extensão instalada.
3. Use o botão "Salvar HTML".
4. O navegador irá baixar um arquivo `.html` com o conteúdo da página, incluindo partes expandidas como "show more".

> Importante: o arquivo é salvo no diretório padrão de Downloads do navegador.

---

## Como rodar o parser

### 1) Entrar na pasta do parser
Abra o terminal e vá para a pasta [Parser](Parser/):

```bash
cd Parser
```

### 2) Instalar as dependências

```bash
pip install -r requirements.txt
```

O arquivo [Parser/requirements.txt](Parser/requirements.txt) contém as dependências necessárias:

```text
pathlib
watchdog
beautifulsoup4
```

### 3) Executar o parser

```bash
python watch_and_extract.py
```

O programa ficará em execução e aguardará novos arquivos `.html` dentro da pasta `Downloads`.

### 4) Resultado esperado
Quando um arquivo HTML é baixado, o parser:
- lê o conteúdo;
- remove tags como `script`, `style`, `svg` e outras que não são texto; 
- extrai o texto limpo;
- salva em:

```text
Parser/Downloads/extracted_text/
```

Exemplo:

```text
Downloads/
├── Juliane Oliveira _ LinkedIn (1).html
├── Maria Beatriz Ribeiro Morales _ LinkedIn.html
└── extracted_text/
    ├── Juliane Oliveira _ LinkedIn (1).txt
    └── Maria Beatriz Ribeiro Morales _ LinkedIn.txt
```

---

## Fluxo completo de uso

1. Instale a extensão no Chrome.
2. Acesse um perfil ou página do LinkedIn.
3. Clique na extensão para salvar o HTML.
4. O arquivo `.html` cai na pasta de Downloads.
5. Execute o parser com Python.
6. O parser lê o novo arquivo e grava uma versão em texto em `Downloads/extracted_text`.
7. Agora você pode abrir o `.txt` e consultar o conteúdo extraído.

---

## Observações importantes

- O parser observa a pasta `./Downloads` relativa à pasta do projeto, ou seja, a pasta [Parser/Downloads](Parser/Downloads).
- Ele ignora arquivos que não são `.html`.
- Para parar a execução do parser, use `Ctrl + C` no terminal.
- Se a página demorar a renderizar ou o download for incompleto, o parser pode deixar de processar temporariamente até o arquivo ficar pronto.

---

## Resumo rápido

- Extensão: salva o HTML da página atual.
- Parser: converte HTML em texto puro.
- Comando para instalar deps:

```bash
cd Parser
pip install -r requirements.txt
```

- Comando para rodar:

```bash
python watch_and_extract.py
```

Se quiser, no futuro este projeto pode evoluir para extração mais estruturada de dados do LinkedIn, como nome, experiência, educação e competências, em vez de apenas texto bruto.
