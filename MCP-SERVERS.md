# MCP Servers Recomendados

Esta guía documenta los MCP (Model Context Protocol) servers configurados en este Starter Kit. Los MCPs permiten que agentes de IA como Claude interactúen directamente con tus herramientas y servicios.

## Requisitos

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) instalado
- Node.js 18+

## MCPs Incluidos en el Starter Kit

Estos MCPs están configurados en `.mcp.json` y se cargan automáticamente:

### 1. Context7 - Documentación Actualizada

Obtiene documentación actualizada de cualquier librería en lugar de depender de datos de entrenamiento.

**Configuración:** Ninguna requerida (gratuito)

**Uso:** Cuando necesites consultar docs de Convex, Next.js, React, Clerk, shadcn/ui, etc.

---

### 2. Sequential Thinking - Razonamiento Estructurado

Permite al agente razonar paso a paso en tareas complejas.

**Configuración:** Ninguna requerida (gratuito)

**Uso:** Planificación de features, debugging de issues complejos, diseño de schemas.

---

### 3. shadcn - Componentes UI

Busca y obtiene ejemplos de componentes shadcn/ui.

**Configuración:** Ninguna requerida (gratuito)

**Uso:** Antes de crear un componente, buscar si ya existe en shadcn.

---

### 4. Convex - Backend Integration

Integración directa con tu backend Convex. Permite ver tablas, ejecutar queries, ver logs y gestionar environment variables.

**Configuración:** Ninguna requerida si ya tienes Convex configurado en el proyecto.

**Herramientas disponibles:**

| Herramienta | Descripción |
|-------------|-------------|
| `status` | Ver deployments disponibles |
| `tables` | Listar tablas con schemas declarados e inferidos |
| `data` | Paginar documentos de una tabla |
| `runOneoffQuery` | Ejecutar queries JavaScript read-only |
| `functionSpec` | Ver metadata de funciones deployadas |
| `run` | Ejecutar funciones de Convex con argumentos |
| `logs` | Ver logs de ejecución de funciones |
| `envList/Get/Set/Remove` | Gestionar environment variables |

**Documentación:** https://docs.convex.dev/ai/convex-mcp-server

---

### 5. Firecrawl - Web Search/Scraping (Requiere API Key)

Busca información en la web y extrae contenido de páginas.

**Configuración requerida:**

#### Paso 1: Obtener API Key

1. Ir a https://www.firecrawl.dev/app/api-keys
2. Crear una cuenta o iniciar sesión
3. Generar una nueva API key (empieza con `fc-`)

#### Paso 2: Configurar la variable de entorno

Abre tu archivo de configuración de shell:

```bash
# Para macOS (zsh por defecto)
code ~/.zshrc

# Si no tienes VS Code, usa:
open -e ~/.zshrc
```

Ve al final del archivo y agrega estas líneas:

```bash
# Firecrawl API Key
export FIRECRAWL_API_KEY=fc-tu-api-key-aqui
```

Reemplaza `fc-tu-api-key-aqui` con tu API key real.

#### Paso 3: Guardar el archivo

Presiona `Cmd + S` (macOS) o `Ctrl + S` (Linux/Windows)

#### Paso 4: Recargar la configuración

Vuelve a la terminal y ejecuta:

```bash
source ~/.zshrc
```

#### Paso 5: Reiniciar Claude Code

```bash
exit
claude
```

#### Verificar que funciona

```bash
claude mcp get firecrawl
```

Deberías ver `Status: ✓ Connected`

**Uso:** Buscar soluciones a errores, documentación externa, patterns de implementación.

**Herramientas disponibles:**

| Herramienta | Descripción |
|-------------|-------------|
| `firecrawl_scrape` | Extraer contenido de una URL |
| `firecrawl_search` | Buscar en la web |
| `firecrawl_map` | Descubrir URLs en un sitio |
| `firecrawl_crawl` | Crawlear múltiples páginas |
| `firecrawl_extract` | Extraer datos estructurados |

**Documentación:** https://github.com/firecrawl/firecrawl-mcp-server

---

## MCPs Opcionales para Instalar

Estos MCPs no vienen incluidos por defecto pero son muy útiles:

### 1. GitHub MCP (ALTA PRIORIDAD)

Búsqueda de código, gestión de PRs e issues directamente desde Claude.

```bash
claude mcp add-json github '{"type":"stdio","command":"npx","args":["-y","@modelcontextprotocol/server-github"],"env":{"GITHUB_PERSONAL_ACCESS_TOKEN":"<tu-token>"}}'
```

**Crear token:** https://github.com/settings/tokens (scopes: `repo`, `read:org`)

**Verificar instalación:**
```bash
claude mcp get github
```

**Herramientas disponibles:**
- Búsqueda de código en repositorios
- Crear/leer/actualizar issues
- Crear/revisar pull requests
- Ver commits y branches

**Documentación:** https://github.com/github/github-mcp-server

---

### 2. Playwright MCP (RECOMENDADO)

Testing E2E automatizado. El agente puede interactuar con tu app en el navegador.

```bash
claude mcp add-json playwright '{"type":"stdio","command":"npx","args":["-y","@playwright/mcp@latest"]}'
```

**Verificar instalación:**
```bash
claude mcp get playwright
```

**Herramientas disponibles:**
- Navegar a URLs
- Hacer click en elementos
- Llenar formularios
- Tomar screenshots
- Verificar contenido de páginas

**Documentación:** https://github.com/microsoft/playwright-mcp

---

### 3. Sentry MCP (PARA PRODUCCIÓN)

Ver y analizar errores de producción directamente desde Claude.

```bash
claude mcp add-json sentry '{"type":"stdio","command":"npx","args":["-y","@sentry/mcp-server"],"env":{"SENTRY_AUTH_TOKEN":"<tu-token>","SENTRY_ORG":"<tu-org>"}}'
```

**Crear token:** https://sentry.io/settings/account/api/auth-tokens/

**Verificar instalación:**
```bash
claude mcp get sentry
```

**Herramientas disponibles:**
- Listar issues/errores
- Ver stack traces
- Correlacionar con releases
- Buscar errores por filtros

**Documentación:** https://mcp.sentry.dev/

---

### 4. Vercel MCP (SI USAS VERCEL)

Gestión de deployments, environment variables y monitoreo.

```bash
claude mcp add-json vercel '{"type":"stdio","command":"npx","args":["-y","vercel-mcp-server"],"env":{"VERCEL_API_TOKEN":"<tu-token>"}}'
```

**Crear token:** https://vercel.com/account/tokens

**Verificar instalación:**
```bash
claude mcp get vercel
```

**Herramientas disponibles:**
- Listar proyectos y deployments
- Ver logs de builds
- Gestionar environment variables
- Monitorear estado de deployments

**Documentación:** https://vercel.com/docs/mcp/vercel-mcp

---

## Comandos Útiles de Claude MCP

```bash
# Listar todos los MCPs instalados
claude mcp list

# Ver detalles de un MCP específico
claude mcp get <nombre>

# Remover un MCP
claude mcp remove <nombre>

# Agregar MCP desde JSON
claude mcp add-json <nombre> '<json-config>'
```

---

## Configuración por Entorno

### Desarrollo Local
- Convex MCP (obligatorio)
- GitHub MCP (recomendado)
- Playwright MCP (opcional)

### Staging/Preview
- Todos los de desarrollo
- Sentry MCP (recomendado)

### Producción
- Sentry MCP (obligatorio)
- Vercel/Netlify MCP (recomendado)

---

## Resumen de Configuración

### MCPs Incluidos (`.mcp.json`)

| MCP | Requiere Config | Gratis |
|-----|-----------------|--------|
| Context7 | No | Sí |
| Sequential Thinking | No | Sí |
| shadcn | No | Sí |
| Convex | No (usa config del proyecto) | Sí |
| Firecrawl | Sí (`FIRECRAWL_API_KEY`) | Freemium |

### MCPs Opcionales (Prioridad de instalación)

| Prioridad | MCP | Motivo |
|-----------|-----|--------|
| 1 | GitHub | Gestión de código y PRs |
| 2 | Playwright | Testing E2E |
| 3 | Sentry | Errores en producción |
| 4 | Vercel | Deployment management |

---

## Seguridad

- **Nunca** commitear tokens en el repositorio
- Usar scopes mínimos necesarios para cada token
- Rotar tokens periódicamente
- En producción, usar secrets management

---

## Troubleshooting

### El MCP no se conecta
```bash
# Verificar estado
claude mcp get <nombre>

# Reiniciar Claude Code
exit
claude
```

### Error de autenticación
- Verificar que el token no haya expirado
- Verificar que el token tenga los scopes correctos

### MCP no aparece después de instalar
- Reiniciar Claude Code (cerrar terminal y abrir de nuevo)
- Verificar con `claude mcp list`

---

## Referencias

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Awesome MCP Servers](https://mcpservers.org/)
- [Convex AI Docs](https://docs.convex.dev/ai)
