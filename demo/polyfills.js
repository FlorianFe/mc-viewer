
import nextTick from 'next-tick'

// Browser Process Polyfill
global.process = window.process || { 
    browser: true, 
    env: { 
        NODE_DEBUG : false 
    } 
}

// Next Tick Polyfill
Object.assign(process, { nextTick: nextTick })