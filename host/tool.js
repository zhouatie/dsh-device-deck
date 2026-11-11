import fsp from 'node:fs/promises';
import { resolveSerial } from './adb.js';
import { captureShot, pickShot, pruneShots } from './screenshots.js';
import { saveState, state } from './state.js';

export function registerTool(ctx) {
  ctx.tools.register({
    name: 'device_screenshot',
    description:
      'Capture the connected Android device screen and return it as an image. Without fresh=true, returns the screenshot currently selected in the device mirror, or the newest saved one. Use this to inspect the live device UI.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        serial: {
          type: 'string',
          description: 'Optional Android device serial. Defaults to the device selected in the mirror.',
        },
        fresh: {
          type: 'boolean',
          description: 'When true, capture the device screen now instead of using a saved screenshot.',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          path: { type: 'string' },
          serial: { type: 'string' },
          width: { type: 'integer' },
          height: { type: 'integer' },
          image: {
            type: 'object',
            additionalProperties: false,
            properties: {
              attachmentId: { type: 'string' },
              mediaType: { type: 'string' },
              bytes: { type: 'integer' },
              width: { type: 'integer' },
              height: { type: 'integer' },
              name: { type: 'string' },
            },
            required: ['attachmentId', 'mediaType', 'bytes', 'width', 'height'],
          },
        },
        required: ['path', 'serial', 'width', 'height'],
      },
      render: (_args, value) => {
        const blocks = [
          {
            type: 'text',
            text: `<path>${value.path}</path>\n<device>${value.serial}</device>\n<type>image</type>\n<content>\n${value.image?.mediaType || 'image'} image, ${value.width}x${value.height} px\n</content>`,
          },
        ];
        if (value.image) blocks.push({ type: 'image', attachment: value.image });
        return blocks;
      },
    },
    isConcurrencySafe: () => false,
    async execute(args) {
      const serial = await resolveSerial(args.serial);
      let shot = args.fresh ? null : await pickShot(serial);
      if (!shot) {
        shot = await captureShot(serial);
        await pruneShots(serial);
      }
      state.lastSerial = serial;
      saveState();
      const data = await fsp.readFile(shot.path);
      let image;
      try {
        const ref = await ctx.attachments.saveImage({ data, mediaType: 'image/png', name: shot.name });
        image = {
          attachmentId: ref.attachmentId,
          mediaType: ref.mediaType,
          bytes: ref.bytes,
          width: ref.width,
          height: ref.height,
          ...(ref.name === undefined ? {} : { name: ref.name }),
        };
      } catch {
        /* text-only fallback */
      }
      return {
        path: shot.path,
        serial,
        width: shot.width,
        height: shot.height,
        ...(image === undefined ? {} : { image }),
      };
    },
  });
}
