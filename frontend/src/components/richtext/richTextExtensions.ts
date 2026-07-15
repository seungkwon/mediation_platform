import { mergeAttributes, Node } from '@tiptap/core'
import type { Editor, NodeViewRenderer } from '@tiptap/core'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { selectedRect } from '@tiptap/pm/tables'

import { mediaUrl } from '@/lib/media'

export type BorderSide = 'left' | 'right' | 'top' | 'bottom' | 'inside'

function createBorderSideAttribute(attrKey: string, cssProp: string, dataAttr: string) {
  return {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute(dataAttr),
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes[attrKey]
      return value ? { [dataAttr]: value, style: `${cssProp}: ${value}` } : {}
    },
  }
}

const cellStyleAttributes = {
  cellBackground: {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute('data-bg'),
    renderHTML: (attributes: { cellBackground?: string | null }) =>
      attributes.cellBackground
        ? { 'data-bg': attributes.cellBackground, style: `background-color: ${attributes.cellBackground}` }
        : {},
  },
  borderTop: createBorderSideAttribute('borderTop', 'border-top', 'data-border-top'),
  borderRight: createBorderSideAttribute('borderRight', 'border-right', 'data-border-right'),
  borderBottom: createBorderSideAttribute('borderBottom', 'border-bottom', 'data-border-bottom'),
  borderLeft: createBorderSideAttribute('borderLeft', 'border-left', 'data-border-left'),
}

export const RichTableCell = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellStyleAttributes }
  },
})

export const RichTableHeader = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellStyleAttributes }
  },
})

// Applies color+width to whichever sides of the currently selected cell range are toggled on.
// 'inside' targets the borders shared between selected cells rather than the outer edge.
export function applyCellBorders(editor: Editor, sides: Set<BorderSide>, color: string, width: number) {
  const value = width === 0 ? 'none' : `${width}px solid ${color}`
  const rect = selectedRect(editor.state)
  const seen = new Set<number>()
  let tr = editor.state.tr
  for (let row = rect.top; row < rect.bottom; row += 1) {
    for (let col = rect.left; col < rect.right; col += 1) {
      const relPos = rect.map.map[row * rect.map.width + col]
      if (seen.has(relPos)) continue
      seen.add(relPos)
      const pos = relPos + rect.tableStart
      const cellNode = tr.doc.nodeAt(pos)
      if (!cellNode) continue

      const attrs: Record<string, string> = {}
      if (sides.has('left') && col === rect.left) attrs.borderLeft = value
      if (sides.has('right') && col === rect.right - 1) attrs.borderRight = value
      if (sides.has('top') && row === rect.top) attrs.borderTop = value
      if (sides.has('bottom') && row === rect.bottom - 1) attrs.borderBottom = value
      if (sides.has('inside')) {
        if (col > rect.left) attrs.borderLeft = value
        if (col < rect.right - 1) attrs.borderRight = value
        if (row > rect.top) attrs.borderTop = value
        if (row < rect.bottom - 1) attrs.borderBottom = value
      }
      if (Object.keys(attrs).length === 0) continue
      tr = tr.setNodeMarkup(pos, undefined, { ...cellNode.attrs, ...attrs })
    }
  }
  editor.view.dispatch(tr)
}

export function applyCellBackground(editor: Editor, color: string) {
  const rect = selectedRect(editor.state)
  const seen = new Set<number>()
  let tr = editor.state.tr
  for (let row = rect.top; row < rect.bottom; row += 1) {
    for (let col = rect.left; col < rect.right; col += 1) {
      const relPos = rect.map.map[row * rect.map.width + col]
      if (seen.has(relPos)) continue
      seen.add(relPos)
      const pos = relPos + rect.tableStart
      const cellNode = tr.doc.nodeAt(pos)
      if (!cellNode) continue
      tr = tr.setNodeMarkup(pos, undefined, { ...cellNode.attrs, cellBackground: color })
    }
  }
  editor.view.dispatch(tr)
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    richImage: {
      insertRichImage: (filePath: string) => ReturnType
    }
    richVideo: {
      insertRichVideo: (filePath: string) => ReturnType
    }
  }
}

const MIN_WIDTH = 80

function applyWidth(el: HTMLElement, width: number | null) {
  el.style.width = width ? `${width}px` : ''
}

function createResizableMediaNodeView(tagName: 'img' | 'video'): NodeViewRenderer {
  return ({ node, editor, getPos }) => {
    // `text-align` has no visual effect on a block-level element itself, so alignment is
    // applied on this outer full-width wrapper, and the media sits in an inline-block inner
    // element that the outer's text-align actually pushes left/center/right.
    const wrapper = document.createElement('div')
    wrapper.style.textAlign = node.attrs.textAlign || 'left'

    const inner = document.createElement('div')
    inner.className = 'relative inline-block max-w-full'
    wrapper.appendChild(inner)

    const el = document.createElement(tagName)
    el.dataset.filePath = node.attrs.filePath
    el.src = mediaUrl(node.attrs.filePath)
    el.className = 'block max-w-full rounded-lg'
    if (tagName === 'video') (el as HTMLVideoElement).controls = true
    applyWidth(el, node.attrs.width)
    inner.appendChild(el)

    if (editor.isEditable) {
      const handle = document.createElement('div')
      handle.className =
        'absolute bottom-1 right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-white bg-primary-500 shadow'
      inner.appendChild(handle)

      handle.addEventListener('pointerdown', (event) => {
        event.preventDefault()
        event.stopPropagation()
        const startX = event.clientX
        const startWidth = el.getBoundingClientRect().width
        const maxWidth = wrapper.clientWidth || startWidth

        const onMove = (moveEvent: PointerEvent) => {
          const delta = moveEvent.clientX - startX
          const nextWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, Math.round(startWidth + delta)))
          applyWidth(el, nextWidth)
        }
        const onUp = () => {
          document.removeEventListener('pointermove', onMove)
          document.removeEventListener('pointerup', onUp)
          const pos = typeof getPos === 'function' ? getPos() : null
          if (pos == null) return
          const width = Math.round(el.getBoundingClientRect().width)
          const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width })
          editor.view.dispatch(tr)
        }
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
      })
    }

    return {
      dom: wrapper,
      update: (updatedNode) => {
        if (updatedNode.type.name !== node.type.name) return false
        applyWidth(el, updatedNode.attrs.width)
        wrapper.style.textAlign = updatedNode.attrs.textAlign || 'left'
        return true
      },
    }
  }
}

const filePathAttribute = {
  filePath: {
    default: null,
    parseHTML: (element: HTMLElement) => element.dataset.filePath ?? null,
    renderHTML: (attributes: { filePath?: string | null }) =>
      attributes.filePath ? { 'data-file-path': attributes.filePath } : {},
  },
}

const widthAttribute = {
  width: {
    default: null,
    parseHTML: (element: HTMLElement) => (element.dataset.width ? Number(element.dataset.width) : null),
    renderHTML: (attributes: { width?: number | null }) =>
      attributes.width ? { 'data-width': String(attributes.width) } : {},
  },
}

export const RichImage = Node.create({
  name: 'richImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      ...filePathAttribute,
      ...widthAttribute,
    }
  },

  parseHTML() {
    return [{ tag: 'img[data-file-path]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return createResizableMediaNodeView('img')
  },

  addCommands() {
    return {
      insertRichImage:
        (filePath: string) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { filePath } }),
    }
  },
})

export const RichVideo = Node.create({
  name: 'richVideo',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      ...filePathAttribute,
      ...widthAttribute,
    }
  },

  parseHTML() {
    return [{ tag: 'video[data-file-path]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return createResizableMediaNodeView('video')
  },

  addCommands() {
    return {
      insertRichVideo:
        (filePath: string) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { filePath } }),
    }
  },
})
