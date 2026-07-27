FROM langchain/langgraphjs-api:24

ADD . /deps/repo
WORKDIR /deps/repo

RUN corepack enable \
    && corepack prepare pnpm@10.33.4 --activate

ENV CI=true

RUN pnpm install --frozen-lockfile
RUN pnpm --filter agent build

WORKDIR /deps/repo/apps/agent

ENV LANGSERVE_GRAPHS='{"travel":"./dist/agent.js:graph"}'

ENV LANGGRAPH_HTTP='{"app":"./dist/api/app.js:app","disable_assistants":false,"disable_threads":false,"disable_runs":false,"disable_store":false,"disable_meta":false}'

RUN if [ -f /api/langgraph_api/js/build.mts ]; then \
      tsx /api/langgraph_api/js/build.mts; \
    else \
      echo "Prebuild script not found, skipping"; \
    fi