import { apply, inject, name } from '../index.js';

if (name !== 'device-deck') throw new Error(`unexpected plugin name: ${name}`);
if (!Array.isArray(inject) || !inject.includes('webServer')) throw new Error('unexpected plugin inject list');
if (typeof apply !== 'function') throw new Error('plugin apply is missing');
console.log('host modules loaded');
