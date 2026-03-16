# Running the backend

## Requirements

### `uv`

To install `uv`, follow the steps below according to your operating system.

#### Linux
``` bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### Windows

``` bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

After installing `uv`, clone the repository. 

```
git clone git@github.com:RenannLimaa/extensaoIII.git
```

Install the required packages for the project.

``` bash
cd backend

uv sync
```

Run the backend

``` bash
uv run uvicorn main:app --reload
```

Access `http://localhost:8000/` and check if the returned message is `Hello World`. If it is, the project was correctly set up. 