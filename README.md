# Implement twitter oauth 2.0 with Node js, Express js, Next js, Re

## Project Setup
Firstly, lets add a `package.json` file at root and add the following content:

```json
{
  "private": true,
  "workspaces": [
    "server",
    "client"
  ],
  "scripts": {
    "client:dev": "yarn workspace client dev",
    "server:dev": "yarn workspace server dev",
    "client:add": "yarn workspace client add",
    "server:add": "yarn workspace server add",
    "migrate-db": "yarn workspace server prisma-mig",
  }
}
```

Now lets install the dependencies with our scripts that we added above.

