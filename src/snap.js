const exists = require('exists')

const html = require('./html')

const DEFAULT_COLOR = '#a8f0f4'
const DEFAULT_SIZE = 10

module.exports = class Snap
{
    /**
     * add edge snapping plugin
     * @param {WindowManager} wm
     * @param {object} options
     * @param {boolean} [options.screen=true] snap to screen edges
     * @param {boolean} [options.windows=true] snap to window edges
     * @param {number} [options.snap=20] distance to edge before snapping and width/height of snap bars
     * @param {string} [options.color=#a8f0f4] color for snap bars
     * @param {number} [options.spacing=5] spacing distance between window and edges
     * @private
     */
    constructor(wm, options)
    {
        options = !exists(options) || typeof options !== 'object' ? {} : options
        this.wm = wm
        this.snap = options.snap || 20
        this.screen = exists(options.screen) ? options.screen : true
        this.windows = exists(options.windows) ? options.windows : true
        const backgroundColor = options.color || DEFAULT_COLOR
        this.size = options.size || DEFAULT_SIZE
        this.spacing = options.spacing || 5
        this.highlights = html({ parent: this.wm.overlay, styles: { 'position': 'absolute' } })
        this.horizontal = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                height: this.size + 'px',
                borderRadius: this.size + 'px',
                backgroundColor
            }
        })
        this.vertical = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                width: this.size + 'px',
                borderRadius: this.size + 'px',
                backgroundColor
            }
        })
        this.horizontal
        this.showing = []
    }

    stop()
    {
        this.highlights.remove()
        this.stopped = true
    }

    addWindow(win)
    {
        win.on('move', () => this.move(win))
        win.on('move-end', () => this.moveEnd(win))
    }

    screenMove(rect, horizontal, vertical)
    {
        const width = document.body.clientWidth
        const height = document.body.clientHeight
        if (rect.left - this.snap <= width && rect.right + this.snap >= 0)
        {
            if (Math.abs(rect.top - 0) <= this.snap)
            {
                horizontal.push({ distance: Math.abs(rect.top - 0), left: 0, width, top: 0, side: 'top' })
            }
            else if (Math.abs(rect.bottom - height) <= this.snap)
            {
                horizontal.push({ distance: Math.abs(rect.bottom - height), left: 0, width, top: height, side: 'bottom' })
            }
        }
        if (rect.top - this.snap <= height && rect.bottom + this.snap >= 0)
        {
            if (Math.abs(rect.left - 0) <= this.snap)
            {
                vertical.push({ distance: Math.abs(rect.left - 0), top: 0, height, left: 0, side: 'left' })
            }
            else if (Math.abs(rect.right - width) <= this.snap)
            {
                vertical.push({ distance: Math.abs(rect.right - width), top: 0, height, left: width, side: 'right' })
            }
        }
    }

    windowsMove(original, rect, horizontal, vertical)
    {
        for (let win of this.wm.windows)
        {
            if (!win.options.noSnap && win !== original)
            {
                const rect2 = win.win.getBoundingClientRect()
                if (rect.left - this.snap <= rect2.right && rect.right + this.snap >= rect2.left)
                {
                    if (Math.abs(rect.top - rect2.bottom) <= this.snap)
                    {
                        horizontal.push({ distance: Math.abs(rect.top - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'top' })
                        if (Math.abs(rect.left - rect2.left) <= this.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true })
                        }
                        else if (Math.abs(rect.right - rect2.right) <= this.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true })
                        }
                    }
                    else if (Math.abs(rect.bottom - rect2.top) <= this.snap)
                    {
                        horizontal.push({ distance: Math.abs(rect.bottom - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'bottom' })
                        if (Math.abs(rect.left - rect2.left) <= this.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true })
                        }
                        else if (Math.abs(rect.right - rect2.right) <= this.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true })
                        }
                    }
                }
                if (rect.top - this.snap <= rect2.bottom && rect.bottom + this.snap >= rect2.top)
                {
                    if (Math.abs(rect.left - rect2.right) <= this.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.left - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'left' })
                        if (Math.abs(rect.top - rect2.top) <= this.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true })
                        }
                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true })
                        }
                    }
                    else if (Math.abs(rect.right - rect2.left) <= this.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.right - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'right' })
                        if (Math.abs(rect.top - rect2.top) <= this.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true })
                        }
                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true })
                        }
                    }
                }
            }
        }
    }

    move(win)
    {
        if (this.stopped || win.options.noSnap)
        {
            return
        }
        this.horizontal.style.display = 'none'
        this.vertical.style.display = 'none'
        const horizontal = []
        const vertical = []
        const rect = win.win.getBoundingClientRect()
        if (this.screen)
        {
            this.screenMove(rect, horizontal, vertical)
        }
        if (this.windows)
        {
            this.windowsMove(win, rect, horizontal, vertical)
        }
        if (horizontal.length)
        {
            horizontal.sort((a, b) => { return a.distance - b.distance })
            const find = horizontal[0]
            this.horizontal.style.display = 'block'
            this.horizontal.style.left = find.left + 'px'
            this.horizontal.style.width = find.width + 'px'
            this.horizontal.style.top = find.top - this.size / 2 + 'px'
            this.horizontal.y = find.top
            this.horizontal.side = find.side
            this.horizontal.noSpacing = find.noSpacing
        }
        if (vertical.length)
        {
            vertical.sort((a, b) => { return a.distance - b.distance })
            const find = vertical[0]
            this.vertical.style.display  = 'block'
            this.vertical.style.top = find.top + 'px'
            this.vertical.style.height = find.height + 'px'
            this.vertical.style.left = find.left - this.size / 2 + 'px'
            this.vertical.x = find.left
            this.vertical.side = find.side
            this.vertical.noSpacing = find.noSpacing
        }
    }

    moveEnd(win)
    {
        if (this.stopped)
        {
            return
        }
        if (this.horizontal.style.display === 'block')
        {
            const spacing = this.horizontal.noSpacing ? 0 : this.spacing
            const adjust = win.minimized ? (win.height - win.height * win.minimized.scaleY) / 2 : 0
            switch (this.horizontal.side)
            {
                case 'top':
                    win.y = this.horizontal.y - adjust + spacing
                    break

                case 'bottom':
                    win.bottom = this.horizontal.y + adjust - spacing
                    break
            }
        }
        if (this.vertical.style.display === 'block')
        {
            const spacing = this.vertical.noSpacing ? 0 : this.spacing
            const adjust = win.minimized ? (win.width - win.width * win.minimized.scaleX) / 2 : 0
            switch (this.vertical.side)
            {
                case 'left':
                    win.x = this.vertical.x - adjust + spacing
                    break

                case 'right':
                    win.right = this.vertical.x + adjust - spacing
                    break
            }
        }
        this.horizontal.style.display = this.vertical.style.display = 'none'
    }
}