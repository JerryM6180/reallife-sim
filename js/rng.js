/* 种子随机数。整个引擎只允许通过这里取随机，保证同种子可复现。
   规则书第101章：运气不可控、不可刷、不偏向玩家 —— 所以不存在"幸运值"属性，
   随机就是随机，不给玩家任何接口去影响它。 */
(function (global) {
  'use strict';

  function RNG(seed) {
    this.s = (typeof seed === 'number' ? seed : Date.now()) >>> 0;
  }

  RNG.prototype.next = function () {
    // mulberry32
    this.s = (this.s + 0x6D2B79F5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /** [min, max] 闭区间整数 */
  RNG.prototype.int = function (min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  };

  RNG.prototype.float = function (min, max) {
    return this.next() * (max - min) + min;
  };

  /** 概率 p 命中 */
  RNG.prototype.chance = function (p) {
    return this.next() < p;
  };

  RNG.prototype.pick = function (arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(this.next() * arr.length)];
  };

  /** 按 weight 字段加权抽取 */
  RNG.prototype.weighted = function (arr, weightFn) {
    if (!arr || !arr.length) return null;
    const w = arr.map(weightFn || ((x) => x.weight || 1));
    let total = 0;
    for (const x of w) total += Math.max(0, x);
    if (total <= 0) return null;
    let r = this.next() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= Math.max(0, w[i]);
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  };

  /** 洗牌（原地） */
  RNG.prototype.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };

  /** 近似正态，用于收入、考试分数这类应该扎堆在中间的量 */
  RNG.prototype.normal = function (mean, sd) {
    const u = Math.max(1e-9, this.next());
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  RNG.prototype.save = function () { return this.s; };
  RNG.prototype.load = function (s) { this.s = s >>> 0; };

  global.RNG = RNG;
})(window);
