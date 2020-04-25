/*
 * Copyright 2020 Telegram V authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
// //MTProto Intermediate Obfuscated Codec W.I.P.
// //Copyright 2019 Oleg Tsenilov
// //https://github.com/OTsenilov
//
import {mt_write_bytes} from "./mt_inob_codec"
import * as sjcl from "../../../../vendor/sjcl"
import BigInteger from "big-integer"

function H(data) {
    return sjcl.hash.sha256.hash(data);
}

function H2(data) {
    return sjcl.hash.sha256.hash(data);
}

function SH(data, salt) {
    var c1 = sjcl.bitArray.concat(salt, data);
    var c2 = sjcl.bitArray.concat(c1, salt);
    return H(c2);
}

function PH1(password, salt1, salt2) {
    return SH(SH(password, salt1), salt2);
}

var hmacSHA512 = function (key) {
    var hasher = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    this.encrypt = function () {
        return hasher.encrypt.apply(hasher, arguments);
    };
};
var pbkdf2Sync_sha512 = function (password, salt, iterations, keylen) {
    var derivedKey = sjcl.misc.pbkdf2(password, salt, iterations, 512, hmacSHA512);
    return derivedKey;
};

export function strToInt32(str: string, pos: number) {
    return (
        str.charCodeAt(pos) << 24
        ^ str.charCodeAt(pos + 1) << 16
        ^ str.charCodeAt(pos + 2) << 8
        ^ str.charCodeAt(pos + 3)
    );
}

function int32ToStr(data: number) {
    return (
        String.fromCharCode((data >> 24) & 0xFF)
        + String.fromCharCode((data >> 16) & 0xFF)
        + String.fromCharCode((data >> 8) & 0xFF)
        + String.fromCharCode(data & 0xFF)
    );
}

interface StreamInterface {
    data: string;
    length: number;
    state: Uint32Array;

    update(data: string | Uint32Array): StreamInterface;

    digest(): string;

    digest(format: 'array'): Uint32Array;
}

export interface Digest {
    blockLength: number,
    digestLength: number,

    (data: string, fmt: 'array'): Uint32Array,

    stream(): StreamInterface,
}

export function hmac(message: string | Uint32Array, _key: string | Uint8Array, digest: Digest): string {
    const intlen = digest.blockLength / 4;
    const ipad = new Uint32Array(intlen);
    const opad = new Uint32Array(intlen);
    const key = new Uint32Array(intlen);

    // if key is longer than blocksize, hash it
    if (typeof _key === 'string') {
        if (_key.length > digest.blockLength) {
            key.set(digest(_key, 'array'), 0);
        } else {
            for (let i = 0; i < _key.length; i += 4) {
                key[i / 4] = strToInt32(_key, i);
            }
        }
    } else {
        key.set(_key, 0);
    }

    // mix key into inner and outer padding
    // ipadding = [0x36 * blocksize] ^ key
    // opadding = [0x5C * blocksize] ^ key
    for (let i = 0; i < intlen; i += 1) {
        ipad[i] = 0x36363636 ^ key[i];
        opad[i] = 0x5C5C5C5C ^ key[i];
    }

    // digest is done like so: hash(opadding | hash(ipadding | message))
    const inner = digest.stream().update(ipad).update(message).digest();
    return digest.stream().update(opad).update(inner).digest();
}

export function xorStr(left: string, right: string, n: number) {
    let s3 = '';
    let b = 0;
    let t = '';
    let i = 0;
    let c = 0;
    for (let j = n; j > 0; j -= 1, i += 1) {
        b = left.charCodeAt(i) ^ right.charCodeAt(i);
        if (c >= 10) {
            s3 += t;
            t = '';
            c = 0;
        }
        t += String.fromCharCode(b);
        c += 1;
    }
    s3 += t;
    return s3;
}

export function pbkdf2(pwd: string | Uint8Array, salt: string, iter: number, dklen: number = 64, digest: Digest): string {
    const hlen = digest.digestLength;
    /* 1. If dkLen > (2^32 - 1) * hLen, output "derived key too long" and stop. */
    if (dklen > (0xFFFFFFFF * hlen)) {
        throw new Error('Derived key is too long.');
    }

    /* 2. Let len be the integer of hLen-octet blocks in the derived key,
      rounding up, and let r be the integer of octets in the last
      block:
      len = CEIL(dkLen / hLen),
      r = dkLen - (len - 1) * hLen. */
    const len = Math.ceil(dklen / hlen);
    const r = dklen - (len - 1) * hlen;

    /* 3. For each block of the derived key apply the function F defined
      below to the password P, the salt S, the iteration count c, and
      the block index to compute the block:
      T_1 = F(P, S, c, 1),
      T_2 = F(P, S, c, 2),
      ...
      T_len = F(P, S, c, len),
      where the function F is defined as the exclusive-or sum of the
      first c iterates of the underlying pseudorandom function PRF
      applied to the password P and the concatenation of the salt S
      and the block index i:
      F(P, S, c, i) = u_1 XOR u_2 XOR ... XOR u_c
      where
      u_1 = PRF(P, S || INT(i)),
      u_2 = PRF(P, u_1),
      ...
      u_c = PRF(P, u_{c-1}).
      Here, INT(i) is a four-octet encoding of the integer i, most
      significant octet first. */
    let dk = '';
    let xor;
    let uc;
    let uc1;

    for (let i = 1; i <= len; i += 1) {
        // PRF(P, S || INT(i)) (first iteration)
        xor = uc1 = hmac(salt + int32ToStr(i), pwd, digest); // eslint-disable-line no-multi-assign

        // PRF(P, u_{c-1}) (other iterations)
        for (let j = 2; j <= iter; j += 1) {
            uc = hmac(uc1, pwd, digest);
            // F(p, s, c, i)
            xor = xorStr(xor, uc, hlen);
            uc1 = uc;
        }

        /* 4. Concatenate the blocks and extract the first dkLen octets to
          produce a derived key DK:
          DK = T_1 || T_2 ||  ...  || T_len<0..r-1> */
        dk += (i < len) ? xor : xor.substr(0, r);
    }

    return dk;
}

function PH2(password, salt1, salt2) {
    var ph1 = PH1(password, salt1, salt2);
    var der_key = SH(pbkdf2Sync_sha512(ph1, salt1, 100000, 512), salt2);

    //BufferSlice buf(32);
    //hash_sha256(password, client_salt, buf.as_slice());
    //hash_sha256(buf.as_slice(), server_salt, buf.as_slice());

    /*var ph1 = PH1(password, salt1, salt2);
    var der_key = SH(

        sjcl.codec.bytes.toBits(pbkdf2(new Uint8Array(sjcl.codec.bytes.fromBits(ph1)), sjcl.codec.bytes.fromBits(salt1), 100000, 512, sha512))
        
        , salt2);*/

    return der_key;
}

//function good_A_first(A, p)
//{
//    var diff = p.subtract(A);
//}
//3af957d1fa37576aac7211c9f884a4095ff0ddf73b5580d4369ebbda83a5ccb2 / ok

export default function mt_srp_check_password(g, p, salt1, salt2, srp_id, srp_B, /*secure_random, */password) {
    console.log("started srp pass check");
    //console.log(password);
    //console.log("----- DURKA 1 -----");
    //console.log(p);

    var g_padded_buffer = new ArrayBuffer(256);
    var g_padded_buffer_view = new DataView(g_padded_buffer);

    g_padded_buffer_view.setUint32(252, g, false);
    var g_padded = new Uint8Array(g_padded_buffer);

    var k_buffer = new ArrayBuffer(256 + 252 + 4);
    var k_buffer_view = new DataView(k_buffer);

    mt_write_bytes(0, 256, new Uint8Array(p), k_buffer_view);

    mt_write_bytes(256, 256, g_padded, k_buffer_view);

    var k_arr = new Uint8Array(k_buffer);
    var k_bits = sjcl.codec.bytes.toBits(k_arr);
    var k = H(k_bits);

    var x = PH2(sjcl.codec.utf8String.toBits(password), sjcl.codec.bytes.toBits(salt1), sjcl.codec.bytes.toBits(salt2));

    var p_bits = sjcl.codec.bytes.toBits(p);
    //console.log("PRIME_BYTES: ");
    //console.log(p.length);
    //AL??
    //console.log(sjcl.codec.hex.fromBits(p_bits));
    var big_g = BigInteger(g.toString(), 10);
    var big_x = BigInteger(sjcl.codec.hex.fromBits(x), 16);
    var big_p = BigInteger(sjcl.codec.hex.fromBits(p_bits), 16);

    var srp_B_bits = sjcl.codec.bytes.toBits(srp_B);
    var g_b = BigInteger(sjcl.codec.hex.fromBits(srp_B_bits), 16);
    //console.log("srp_B checks...");
    //console.log(g_b.toString(16));
    //sb > 0 and p - sb > 0
    if (g_b.compareTo(BigInteger.one) < 0) {
        console.log("g_b <= 0 FAULT!");
    }

    if ((big_p.subtract(g_b)).compareTo(BigInteger.one) < 0) {
        console.log("g_b <= 0 FAULT!");
    }


    //console.log("----- DURKA 1.5 -----");
    //console.log(big_p.toByteArray());
    var v = big_g.modPow(big_x, big_p);

    var big_k = BigInteger(sjcl.codec.hex.fromBits(k), 16);

    var k_v = (big_k.multiply(v)).mod(big_p);

    //var a_s = sjcl.codec.bytes.toBits(secure_random);
    var a = sjcl.random.randomWords(64);
    //TODO CHECK RANDOM

    var big_a = BigInteger(sjcl.codec.hex.fromBits(a), 16);

    var g_a = big_g.modPow(big_a, big_p);
    //console.log("--- g_a p DEBUG ---");
    //console.log(g_a);
    //console.log("----- DURKA 2 -----");
    //console.log(big_p.length);
    //console.log(new Uint8Array(big_p.toByteArray()));
    //console.log("hard cmp:");
    //var durk = BigInteger("c71caeb9c6b1c9048e6c522f70f13f73980d40238e3e21c14934d037563d930f48198a0aa7c14058229493d22530f4dbfa336f6e0ac925139543aed44cce7c3720fd51f69458705ac68cd4fe6b6b13abdc9746512969328454f18faf8c595f642477fe96bb2a941d5bcd1d4ac8cc49880708fa9b378e3c4f3a9060bee67cf9a4a4a695811051907e162753b56b0f6b410dba74d8a84b2a14b3144e0ef1284754fd17ed950d5965b4b9dd46582db1178d169c6bc465b0d6ff9ca3928fef5b9ae4e418fc15e83ebea0f87fa9ff5eed70050ded2849f47bf959d956850ce929851f0d8115f635b105ee2e4e15d04b2454bf6f4fadf034b10403119cd8e3b92fcc5b", 16);
    //console.log(durk.toByteArray());
    //console.log(durk.toString(16));
    //console.log(sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(big_p.toByteArray())));
    //console.log("checking exp cf...");
    var dexp_1984 = BigInteger("1751908409537131537220509645351687597690304110853111572994449976845956819751541616602568796259317428464425605223064365804210081422215355425149431390635151955247955156636234741221447435733643262808668929902091770092492911737768377135426590363166295684370498604708288556044687341394398676292971255828404734517580702346564613427770683056761383955397564338690628093211465848244049196353703022640400205739093118270803778352768276670202698397214556629204420309965547056893233608758387329699097930255380715679250799950923553703740673620901978370802540218870279314810722790539899334271514365444369275682816", 10);

    if (g_a.compareTo(BigInteger.one) <= 0) {
        console.log("g_a <= 0 FAULT!");
    }
    if (g_a.compareTo(big_p.subtract(BigInteger.one)) >= 0) {
        console.log("g_a >= big_p - 1 FAULT!");
    }
    if (g_a.compareTo(dexp_1984) < 0) {
        console.log("g_a < dexp_1984 FAULT!");
    }

    if (g_a.compareTo(big_p.subtract(dexp_1984)) >= 0) {
        console.log("g_a >= big_p - dexp_1984");
    }

    //console.log("-------------------\n");

    //WARNING TODO!!!!
    //man ssl -> BN_cmp() returns -1 if a < b, 0 if a == b and 1 if a > b. BN_ucmp() is the same using the absolute values of a and b.
    //so,  if t < zero then t = t + big_p
    var t = ((g_b.subtract(k_v)).mod(big_p));
    if (t.compareTo(BigInteger.zero) < 0) {
        console.log("ZERO CHECK OP LESS");
        t = t.add(big_p);
    } else {
        console.log("ZERO CHECK OP OK");
    }

    //console.log("checking t/p...");
    //console.log("----");
    //console.log(t);
    //console.log(t.toString(16));
    //console.log("----");
    //var dexp_1984 = BigInteger("1751908409537131537220509645351687597690304110853111572994449976845956819751541616602568796259317428464425605223064365804210081422215355425149431390635151955247955156636234741221447435733643262808668929902091770092492911737768377135426590363166295684370498604708288556044687341394398676292971255828404734517580702346564613427770683056761383955397564338690628093211465848244049196353703022640400205739093118270803778352768276670202698397214556629204420309965547056893233608758387329699097930255380715679250799950923553703740673620901978370802540218870279314810722790539899334271514365444369275682816", 10);

    if (t.compareTo(BigInteger.one) <= 0) {
        console.log("t <= 0 FAULT!");
    }
    if (t.compareTo(big_p.subtract(BigInteger.one)) >= 0) {
        console.log("t >= big_p - 1 FAULT!");
    }
    if (t.compareTo(dexp_1984) < 0) {
        console.log("t < dexp_1984 FAULT!");
    }

    if (t.compareTo(big_p.subtract(dexp_1984)) >= 0) {
        console.log("t >= big_p - dexp_1984");
    }

    //console.log("-------------------\n");

    //u := H(g_a | g_b)

    //console.log("DURKA 3");

    ///console.log(g_a.toString(16));
    ///console.log(g_a.toString(16).slice((257 - 256) * 2));

    //console.log(g_a.toByteArray());
    //console.log(g_a.toString(16));
    var g_a_bits = sjcl.codec.hex.toBits(g_a.toString(16));
    var u = H(sjcl.bitArray.concat(g_a_bits, srp_B_bits));

    var big_u = BigInteger(sjcl.codec.hex.fromBits(u), 16);
    var aux = big_a.add((big_u.multiply(big_x))); //TODO: RE-CHECK
    var s_a = t.modPow(aux, big_p);

    //console.log(s_a.toString(16));
    //console.log(s_a.toString(16).slice((257 - 256) * 2));
    var k_a = H(sjcl.codec.hex.toBits(s_a.toString(16)));

    //M1 := H(  H(p) xor H(g) | H2(salt1) | H2(salt2) | g_a | g_b | k_a  )

    var g_padded_bits = sjcl.codec.bytes.toBits(g_padded);

    var H_p = BigInteger(sjcl.codec.hex.fromBits(H(p_bits)), 16);
    var H_g = BigInteger(sjcl.codec.hex.fromBits(H(g_padded_bits)), 16);

    //console.log((H_p.xor(H_g)).toString(16));
    //console.log((H_p.xor(H_g)).toString(16).slice((257 - 256) * 2));
    var H_pg_xor_bits = sjcl.codec.hex.toBits((H_p.xor(H_g)).toString(16));
    var H2_salt1 = H(sjcl.codec.bytes.toBits(salt1));
    var H2_salt2 = H(sjcl.codec.bytes.toBits(salt2));

    var c1 = sjcl.bitArray.concat(H_pg_xor_bits, H2_salt1);
    var c2 = sjcl.bitArray.concat(c1, H2_salt2);
    var c3 = sjcl.bitArray.concat(c2, g_a_bits);
    var c4 = sjcl.bitArray.concat(c3, srp_B_bits)

    var M1 = H(sjcl.bitArray.concat(c4, k_a));

    var M1_bytes = sjcl.codec.bytes.fromBits(M1);
    var g_a_bytes = sjcl.codec.bytes.fromBits(g_a_bits);
    //console.log("M1:" + new Uint8Array(M1_bytes));
    //console.log("A: " + new Uint8Array(g_a_bytes));

    return {
        srp_id: srp_id,
        A: new Uint8Array(g_a_bytes),
        M1: new Uint8Array(M1_bytes)
    };
}