import tomllib 

with open('pyproject.toml', 'rb') as file:
    data = tomllib.load(file)
    version = data['project']['version']
    
    