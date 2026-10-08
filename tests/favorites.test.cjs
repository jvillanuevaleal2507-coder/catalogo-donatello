'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '..', 'src', 'favorites.js'), 'utf8');
const start = source.indexOf('function escapeHtml(');
const end = source.indexOf('function readFavorites()', start);
assert.ok(start >= 0 && end > start, 'safe markup helpers available');
const { escapeHtml, safeImageUrl } = new Function(source.slice(start, end) + '\nreturn {escapeHtml,safeImageUrl};')();

test('product name containing HTML is displayed only as escaped text', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('quotes cannot escape HTML attributes', () => {
  assert.equal(escapeHtml('" onerror="alert(1)'), '&quot; onerror=&quot;alert(1)');
  assert.equal(escapeHtml("' onload='x"), '&#39; onload=&#39;x');
});

test('ampersand escaped before all other characters', () => {
  assert.equal(escapeHtml('A & B < C'), 'A &amp; B &lt; C');
});

test('blocks javascript and data image URLs', () => {
  assert.equal(safeImageUrl('javascript:alert(1)'), '');
  assert.equal(safeImageUrl('data:image/svg+xml,<svg/onload=alert(1)>'), '');
  assert.equal(safeImageUrl('ftp://example.com/image.jpg'), '');
});

test('allows ordinary HTTPS image URLs', () => {
  assert.equal(safeImageUrl('https://example.com/photo.jpg'), 'https://example.com/photo.jpg');
});

test('invalid or missing image URLs are rejected', () => {
  assert.equal(safeImageUrl('not a url'), '');
  assert.equal(safeImageUrl(null), '');
});

test('favorite drawer interpolations encode all user-supplied fields', () => {
  assert.match(source, /escapeHtml\(item\.name\)/);
  assert.match(source, /escapeHtml\(item\.code\)/);
  assert.match(source, /escapeHtml\(item\.price\)/);
  assert.match(source, /escapeHtml\(safeImageUrl\(item\.image\)\)/);
});
