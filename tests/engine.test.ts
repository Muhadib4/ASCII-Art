import { describe, expect, it, vi, afterEach } from 'vitest';
import { processImage } from '../src/features/ascii/processor';
import { generateTextArt } from '../src/features/ascii/text';
import { buildArtworkScene, artworkToSVG, getArtworkDimensions, renderArtwork, validateRasterSize } from '../src/features/ascii/renderer';
import { loadImageFile } from '../src/features/ascii/source';
import { DEFAULT_ASCII_SETTINGS, DEFAULT_ARTWORK_STYLE, DEFAULT_TEXT_SETTINGS, type PixelSource, type AsciiResult, type CompositionLayer } from '../src/features/ascii/types';

const neutral = { ...DEFAULT_ASCII_SETTINGS, width: 8, aspectRatio: 1, contrast: 0, ramp: '@ ' };
function source(width = 8, height = 8, pixel: (x: number, y: number) => number[] = x => [x / (width - 1) * 255, x / (width - 1) * 255, x / (width - 1) * 255, 255]): PixelSource {
  return { width, height, data: new Uint8ClampedArray(Array.from({ length: width * height }, (_, i) => pixel(i % width, Math.floor(i / width))).flat()) };
}
function grid(lines: string[]): AsciiResult {
  const cols = Array.from(lines[0]).length;
  return { cols, rows: lines.length, text: lines.join('\n'), chars: lines.flatMap(line => Array.from(line)) };
}
afterEach(() => vi.unstubAllGlobals());

describe('Image processing', () => {
  it('maps black to dense characters and white to whitespace', () => {
    const art = processImage(source(), neutral);
    expect(art.text.split('\n')).toEqual(Array(8).fill('@@@@    '));
    expect(art.chars).toHaveLength(64);
  });
  it('retains leading/trailing whitespace and the exact row grid', () => {
    const art = processImage(source(), { ...neutral, ramp: ' @' });
    expect(art.text).toBe(Array(8).fill('    @@@@').join('\n'));
  });
  it('preserves original colors and alpha without a double white composite', () => {
    const art = processImage(source(8, 1, () => [200, 40, 20, 128]), neutral);
    expect(Array.from(art.colors!.slice(0, 3))).toEqual([200, 40, 20]);
    expect(art.alpha![0]).toBe(128);
  });
  it('skips fully transparent cells, including in diffusion', () => {
    const art = processImage(source(8, 1, () => [0, 0, 0, 0]), { ...neutral, dither: 'floyd-steinberg' });
    expect(art.text).toBe('        ');
  });
  it('flattens transparency against the selected backdrop', () => {
    const pixels = source(8, 1, () => [0, 0, 0, 0]);
    expect(processImage(pixels, { ...neutral, transparency: 'white' }).text).toBe('        ');
    expect(processImage(pixels, { ...neutral, transparency: 'black' }).text).toBe('@@@@@@@@');
  });
  it('uses weighted area sampling instead of dropping small image detail', () => {
    const art = processImage(source(16, 2, x => x % 2 ? [255,255,255,255] : [0,0,0,255]), { ...neutral, ramp: '@. ' });
    expect(new Set(art.chars)).toEqual(new Set(['.']));
    expect(art.colors![0]).toBe(128);
  });
  it.each(['none', 'threshold', 'bayer', 'floyd-steinberg', 'atkinson'] as const)('%s is deterministic and preserves grid geometry', dither => {
    const pixels = source(16, 16);
    const options = { ...neutral, width: 16, dither };
    const first = processImage(pixels, options);
    expect(first.text).toBe(processImage(pixels, options).text);
    expect(first.chars).toHaveLength(256);
    expect(new Set(first.chars)).toEqual(new Set(['@',' ']));
  });
  it('each dithering algorithm distributes tones differently', () => {
    const pixels = source(16,16, () => [102,102,102,255]);
    const outputs = ['none','bayer','floyd-steinberg','atkinson'].map(dither => processImage(pixels, { ...neutral, width: 16, dither: dither as typeof neutral.dither }).text);
    expect(new Set(outputs).size).toBe(4);
    for (const dither of ['bayer','floyd-steinberg','atkinson'] as const) {
      const count = processImage(pixels, { ...neutral, width: 16, dither }).chars.filter(char => char === ' ').length;
      expect(count).toBeGreaterThan(55); expect(count).toBeLessThan(135);
    }
  });
  it('threshold and inversion affect the actual output', () => {
    const pixels = source();
    const low = processImage(pixels, { ...neutral, dither: 'threshold', threshold: 10 });
    const high = processImage(pixels, { ...neutral, dither: 'threshold', threshold: 250 });
    expect(low.text).not.toBe(high.text);
    expect(processImage(pixels, { ...neutral, invert: true }).text.split('\n')[0]).toBe('    @@@@');
  });
  it('rejects corrupt and fractional source dimensions', () => {
    expect(() => processImage({ data: new Uint8ClampedArray(1), width: 1, height: 1 }, neutral)).toThrow(/read/);
    expect(() => processImage({ data: new Uint8ClampedArray(8), width: 0.5, height: 4 }, neutral)).toThrow(/read/);
  });
  it('bounded output resolution protects memory even with extreme settings', () => {
    const art = processImage(source(1,8), { ...neutral, width: 100000, aspectRatio: 100 });
    expect(art.cols).toBe(320); expect(art.rows).toBe(500);
  });
  it('removes control characters from user ramps', () => {
    const art = processImage(source(), { ...neutral, ramp: '@\n\t\r ' });
    expect(new Set(art.chars)).toEqual(new Set(['@',' ']));
  });
  it('edge emphasis is perceptible across the UI range', () => {
    const pixels = source(16,16,(x,y) => { const n = x > 4 && x < 11 && y > 4 && y < 11 ? 20 : 210; return [n,n,n,255]; });
    expect(processImage(pixels, { ...neutral, width: 16, edgeEnhance: 2 }).text).not.toBe(processImage(pixels, { ...neutral, width: 16 }).text);
  });
});

describe('Text generation', () => {
  it.each(['block','outline','slant','dots','compact'] as const)('renders %s without breaking whitespace geometry', font => {
    const art = generateTextArt('ASCII\nSTUDIO', { ...DEFAULT_TEXT_SETTINGS, font });
    expect(art.rows).toBeGreaterThan(1);
    expect(art.chars.length).toBe(art.cols * art.rows);
    expect(art.text.split('\n').every(row => Array.from(row).length === art.cols)).toBe(true);
  });
  it('keeps lowercase distinct from uppercase', () => {
    const upper = generateTextArt('Hello', { ...DEFAULT_TEXT_SETTINGS, case: 'upper' });
    const lower = generateTextArt('Hello', { ...DEFAULT_TEXT_SETTINGS, case: 'lower' });
    expect(upper.text).not.toBe(lower.text);
  });
  it('does not cancel the slant when right-aligning', () => {
    const art = generateTextArt('H', { ...DEFAULT_TEXT_SETTINGS, font: 'slant', alignment: 'right' });
    const rows = art.text.split('\n');
    expect(rows[0].indexOf('█') - rows[6].indexOf('█')).toBe(3);
  });
  it('supports custom drawing characters and ignores control characters', () => {
    const art = generateTextArt('A\r\nB', { ...DEFAULT_TEXT_SETTINGS, density: '\n#' });
    expect(new Set(art.chars)).toEqual(new Set([' ','#']));
  });
  it('wraps large banners to the requested width', () => {
    const art = generateTextArt('HELLO WORLD', { ...DEFAULT_TEXT_SETTINGS, width: 40 });
    expect(art.cols).toBeLessThanOrEqual(40); expect(art.rows).toBeGreaterThan(7);
  });
});

describe('Shared Canvas and SVG composition', () => {
  const art = grid([' A ', 'AAA']);
  const style = { ...DEFAULT_ARTWORK_STYLE, fontSize: 10, padding: 10, border: 0 };
  it('preserves the relative position of bitmap rows in all alignments', () => {
    for (const alignment of ['left','center','right'] as const) {
      const scene = buildArtworkScene(art,{ ...style, alignment });
      expect(scene.glyphs[0].x - scene.glyphs[1].x).toBe(scene.cellWidth);
    }
  });
  it('uses the same glyph positions and colors in SVG as the canvas scene', () => {
    const scene = buildArtworkScene(art, style);
    const svg = artworkToSVG(art, style);
    for (const glyph of scene.glyphs) expect(svg).toContain(`x="${glyph.x}" y="${Math.round(glyph.y * 1000) / 1000}" font-size="${glyph.size}" fill="${glyph.color}"`);
    expect(svg).toContain(`viewBox="0 0 ${scene.width} ${scene.height}"`);
  });
  it('draws Canvas glyphs from that same scene', () => {
    const context = { setTransform: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), strokeRect: vi.fn() };
    const canvas = { width: 0, height: 0, getContext: () => context } as unknown as HTMLCanvasElement;
    renderArtwork(canvas, art, style, [], { scale: 2 });
    const scene = buildArtworkScene(art,style);
    expect(context.fillText.mock.calls).toEqual(scene.glyphs.map(g => [g.text,g.x,g.y]));
    expect(canvas.width).toBe(scene.width * 2);
  });
  it('exports transparent backgrounds without a background rectangle', () => {
    const scene = buildArtworkScene(art, style, [], { transparent:true });
    expect(scene.background).toBe(null);
    expect(artworkToSVG(art,style,[],{transparent:true})).not.toContain('<rect');
  });
  it('omits layers and frames only when requested', () => {
    const layer: CompositionLayer = { id:'1', type:'title',text:'TITLE',x:50,y:10,fontSize:16,color:'#ff0000',opacity:.5,alignment:'center',visible:true };
    const framed = {...style,frame:'corners' as const};
    expect(buildArtworkScene(art,framed,[layer]).glyphs).toHaveLength(9);
    const scene=buildArtworkScene(art,framed,[layer],{includeLayers:false,includeFrame:false});
    expect(scene.glyphs).toHaveLength(4);expect(scene.lines).toHaveLength(0);
  });
  it('escapes XML in artwork and captions', () => {
    const svg=artworkToSVG(grid(['<&>']),style);
    expect(svg).toContain('&lt;');expect(svg).toContain('&amp;');expect(svg).not.toContain('><</text>');
  });
  it('maps source, gradient, duotone, and ANSI color modes', () => {
    const colored={...grid(['AB']),colors:new Uint8ClampedArray([0,0,0,255,255,255])};
    expect(buildArtworkScene(colored,{...style,colorMode:'source'}).glyphs.map(g=>g.color)).toEqual(['rgb(0,0,0)','rgb(255,255,255)']);
    expect(new Set(buildArtworkScene(colored,{...style,colorMode:'gradient'}).glyphs.map(g=>g.color)).size).toBe(2);
    expect(new Set(buildArtworkScene(colored,{...style,colorMode:'duotone'}).glyphs.map(g=>g.color)).size).toBe(2);
    expect(buildArtworkScene(colored,{...style,colorMode:'ansi'}).glyphs[1].color).toBe('#ffffff');
  });
  it('rejects oversized or invalid raster exports before allocation', () => {
    expect(()=>validateRasterSize(10000,10000,2)).toThrow(/too large/);
    expect(()=>validateRasterSize(NaN,100,1)).toThrow(/too large/);
    expect(()=>getArtworkDimensions({...art,cols:Infinity},style)).toThrow(/invalid/);
    expect(()=>validateRasterSize(1000,1000,2)).not.toThrow();
  });
});

describe('Local upload validation', () => {
  it('rejects unsupported, empty and oversized files before decoding', async () => {
    await expect(loadImageFile(new File(['x'],'script.js',{type:'text/javascript'}))).rejects.toThrow(/Choose/);
    await expect(loadImageFile(new File([],'empty.png',{type:'image/png'}))).rejects.toThrow(/empty/);
    const large = { name:'large.png',type:'image/png',size:31*1024*1024 } as File;
    await expect(loadImageFile(large)).rejects.toThrow(/30 MB/);
  });
  it('revokes temporary URLs when decode fails', async () => {
    const revoke=vi.spyOn(URL,'revokeObjectURL');
    vi.stubGlobal('Image',class { src=''; decode(){return Promise.reject(new Error('corrupt'));} });
    await expect(loadImageFile(new File(['broken'],'image.png',{type:'image/png'}))).rejects.toThrow(/decoded/);
    expect(revoke).toHaveBeenCalledOnce();revoke.mockRestore();
  });
});
