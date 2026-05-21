"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPIRY_WARNING_MS = exports.SLUG_LENGTH = exports.MAX_BODY_SIZE = exports.MAX_REQUESTS_PER_BIN = exports.BIN_TTL_SECONDS = exports.BIN_TTL_MS = exports.METHOD_COLORS = void 0;
// === HTTP Method Colors ===
exports.METHOD_COLORS = {
    POST: '#3b82f6',
    GET: '#22c55e',
    PUT: '#f59e0b',
    PATCH: '#a855f7',
    DELETE: '#ef4444',
    OPTIONS: '#6b7280',
    HEAD: '#6b7280',
};
// === Constants ===
exports.BIN_TTL_MS = 60 * 60 * 1000; // 1 hour
exports.BIN_TTL_SECONDS = 60 * 60; // 1 hour
exports.MAX_REQUESTS_PER_BIN = 100;
exports.MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB
exports.SLUG_LENGTH = 8;
exports.EXPIRY_WARNING_MS = 5 * 60 * 1000; // 5 minutes before expiry
