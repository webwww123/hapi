import { describe, expect, it } from 'vitest';
import { buildSyntheticPreambleFromToolInput } from './codexSyntheticPreamble';

describe('buildSyntheticPreambleFromToolInput', () => {
    it('uses parsed list_files path when available', () => {
        expect(buildSyntheticPreambleFromToolInput({
            cwd: '/root',
            parsed_cmd: [{ type: 'list_files', path: '/root' }]
        })).toBe('我先看一下 `/root` 的目录内容。');
    });

    it('uses read path for file reads', () => {
        expect(buildSyntheticPreambleFromToolInput({
            cwd: '/root',
            parsed_cmd: [{ type: 'read', path: '/root/README.md' }]
        })).toBe('我先看一下 `/root/README.md` 这个文件。');
    });

    it('falls back to command inspection for directory listing', () => {
        expect(buildSyntheticPreambleFromToolInput({
            cwd: '/root',
            command: ['/bin/bash', '-lc', 'find "/root" -maxdepth 2 -mindepth 1 | sort']
        })).toBe('我先看一下 `/root` 的目录内容。');
    });

    it('falls back to cwd when command details are not useful', () => {
        expect(buildSyntheticPreambleFromToolInput({
            cwd: '/tmp/workspace',
            command: '/bin/bash -lc env'
        })).toBe('我先在 `/tmp/workspace` 里检查一下。');
    });
});
