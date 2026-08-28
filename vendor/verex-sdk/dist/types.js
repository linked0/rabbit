"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureType = exports.Side = void 0;
/// Mirrors Polymarket's `Side` enum (OrderStructs.sol). Encoded as uint8 in
/// EIP-712 typed data and on-chain calls.
var Side;
(function (Side) {
    Side[Side["BUY"] = 0] = "BUY";
    Side[Side["SELL"] = 1] = "SELL";
})(Side || (exports.Side = Side = {}));
/// Mirrors Polymarket's `SignatureType` enum. Stage 1 only uses EOA; the
/// POLY_PROXY / POLY_GNOSIS_SAFE variants are reserved for S7 AA work.
var SignatureType;
(function (SignatureType) {
    SignatureType[SignatureType["EOA"] = 0] = "EOA";
    SignatureType[SignatureType["POLY_PROXY"] = 1] = "POLY_PROXY";
    SignatureType[SignatureType["POLY_GNOSIS_SAFE"] = 2] = "POLY_GNOSIS_SAFE";
})(SignatureType || (exports.SignatureType = SignatureType = {}));
//# sourceMappingURL=types.js.map