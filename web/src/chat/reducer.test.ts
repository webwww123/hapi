import { describe, expect, it } from 'vitest'
import { reduceChatBlocks } from '@/chat/reducer'
import type { NormalizedMessage } from '@/chat/types'

describe('reduceChatBlocks', () => {
    it('collapses streamed codex text updates into a single assistant block', () => {
        const messages: NormalizedMessage[] = [
            {
                id: 'm1',
                localId: null,
                createdAt: 1,
                role: 'agent',
                isSidechain: false,
                content: [{ type: 'text', text: 'Hel', streamId: 'stream-1', uuid: 'stream-1', parentUUID: null }]
            },
            {
                id: 'm2',
                localId: null,
                createdAt: 2,
                role: 'agent',
                isSidechain: false,
                content: [{ type: 'text', text: 'Hello', streamId: 'stream-1', uuid: 'stream-1', parentUUID: null }]
            },
            {
                id: 'm3',
                localId: null,
                createdAt: 3,
                role: 'agent',
                isSidechain: false,
                content: [{ type: 'text', text: 'Hello world', streamId: 'stream-1', uuid: 'stream-1', parentUUID: null }]
            }
        ]

        const reduced = reduceChatBlocks(messages, null)

        expect(reduced.blocks).toEqual([
            {
                kind: 'agent-text',
                id: 'stream:stream-1',
                localId: null,
                createdAt: 1,
                text: 'Hello world',
                meta: undefined
            }
        ])
    })

    it('deduplicates duplicate final codex messages when they share the same stream id', () => {
        const messages: NormalizedMessage[] = [
            {
                id: 'm1',
                localId: null,
                createdAt: 1,
                role: 'agent',
                isSidechain: false,
                content: [{ type: 'text', text: 'Done', streamId: 'stream-1', uuid: 'stream-1', parentUUID: null }]
            },
            {
                id: 'm2',
                localId: null,
                createdAt: 2,
                role: 'agent',
                isSidechain: false,
                content: [{ type: 'text', text: 'Done', streamId: 'stream-1', uuid: 'stream-1', parentUUID: null }]
            }
        ]

        const reduced = reduceChatBlocks(messages, null)

        expect(reduced.blocks).toHaveLength(1)
        expect(reduced.blocks[0]).toMatchObject({
            kind: 'agent-text',
            id: 'stream:stream-1',
            text: 'Done'
        })
    })
})
