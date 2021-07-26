Extension may have really many requests and handlers, to simplify maintenance it, we must obey this development principles:

- Keep handlers and all hooks for interact with it in one subdirectory here
- Use runtime type library to define data signatures instead manual check it
- Group requests in directories by type and by meaning
