type ParsedCommand = {
    type?: unknown;
    path?: unknown;
    name?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
        return null;
    }
    return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeCommand(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    if (Array.isArray(value)) {
        const parts = value.filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
        if (parts.length > 0) {
            const shellSnippet = parts[parts.length - 1];
            if (parts.length >= 2 && shellSnippet && /[\s"'`;&|]/.test(shellSnippet)) {
                return shellSnippet.trim();
            }
            return parts.join(' ');
        }
    }
    return null;
}

function extractFirstParsedCommand(value: unknown): ParsedCommand | null {
    if (!Array.isArray(value)) {
        return null;
    }
    for (const entry of value) {
        const record = asRecord(entry);
        if (record) {
            return record;
        }
    }
    return null;
}

function extractInterestingPath(command: string): string | null {
    const quoted = command.match(/"((?:\/[^"\\]|\\.)+)"/);
    if (quoted?.[1]) {
        return quoted[1].replace(/\\"/g, '"');
    }

    const singleQuoted = command.match(/'((?:\/[^'\\]|\\.)+)'/);
    if (singleQuoted?.[1]) {
        return singleQuoted[1].replace(/\\'/g, '\'');
    }

    const bare = command.match(/(?:^|\s)(\/[^\s"'`;&|]+)/);
    return bare?.[1] ?? null;
}

function formatPath(path: string | null): string {
    return path ? `\`${path}\`` : '当前目录';
}

export function buildSyntheticPreambleFromToolInput(input: unknown): string | null {
    const inputRecord = asRecord(input);
    if (!inputRecord) {
        return null;
    }

    const parsedCommand = extractFirstParsedCommand(inputRecord.parsed_cmd);
    const parsedType = asString(parsedCommand?.type)?.toLowerCase() ?? null;
    const parsedPath = asString(parsedCommand?.path) ?? asString(parsedCommand?.name);
    const cwd = asString(inputRecord.cwd);
    const command = normalizeCommand(inputRecord.command);
    const path = parsedPath ?? (command ? extractInterestingPath(command) : null) ?? cwd;
    const pathLabel = formatPath(path);

    if (parsedType === 'read') {
        return `我先看一下 ${pathLabel} 这个文件。`;
    }

    if (parsedType === 'search') {
        return path ? `我先在 ${pathLabel} 里搜一下相关内容。` : '我先搜索一下相关内容。';
    }

    if (parsedType === 'list_files') {
        return `我先看一下 ${pathLabel} 的目录内容。`;
    }

    if (command) {
        if (/\b(find|ls|tree)\b/.test(command)) {
            return `我先看一下 ${pathLabel} 的目录内容。`;
        }
        if (/\b(rg|grep)\b/.test(command)) {
            return path ? `我先在 ${pathLabel} 里搜一下相关内容。` : '我先搜索一下相关内容。';
        }
        if (/\b(cat|head|tail|sed)\b/.test(command)) {
            return `我先看一下 ${pathLabel} 的内容。`;
        }
    }

    if (cwd) {
        return `我先在 ${formatPath(cwd)} 里检查一下。`;
    }

    return '我先检查一下相关内容。';
}
