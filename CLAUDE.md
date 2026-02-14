# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code Sandbox** — a dev container configuration that provides a sandboxed Node.js development environment for running Claude Code with restricted network access. It is not an application project; it contains only container infrastructure and configuration files.

## Structure

All configuration lives in `.devcontainer/`:
- **Dockerfile** — Node.js 20 base image with dev tools (git, zsh, fzf, gh, vim, nano, jq), git-delta, zsh-in-docker with Powerlevel10k, and `@anthropic-ai/claude-code` installed globally via npm
- **devcontainer.json** — VS Code dev container config: extensions (Claude Code, ESLint, Prettier, GitLens), editor settings, volume mounts for bash history and `.claude` config, container env vars
- **init-firewall.sh** — Post-start firewall script that applies a strict default-deny iptables policy, only allowing: DNS (UDP 53), SSH (TCP 22), localhost, host network, and specific allowlisted domains (npm registry, Anthropic API, Sentry, Statsig, VS Code marketplace)

## Building and Running

The container is built and managed via VS Code's Remote - Containers extension. Direct commands:

```bash
# Build the container image
docker build -f .devcontainer/Dockerfile .devcontainer/

# Build args (all have defaults):
#   TZ, CLAUDE_CODE_VERSION, GIT_DELTA_VERSION, ZSH_IN_DOCKER_VERSION
```

The container requires `--cap-add=NET_ADMIN --cap-add=NET_RAW` for the firewall setup. After start, `init-firewall.sh` runs automatically and verifies the firewall blocks unauthorized egress.

## Key Design Decisions

- **Non-root user**: Container runs as `node` user; firewall script is the only sudoers exception
- **Network isolation**: Default-deny firewall with domain-based allowlisting via ipset; DNS resolution happens at firewall init time
- **Persistent state**: Bash history and `.claude` config survive container rebuilds via named Docker volumes
- **Node memory**: `NODE_OPTIONS=--max-old-space-size=4096` is set globally
