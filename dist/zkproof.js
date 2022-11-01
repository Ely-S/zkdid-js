"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyZKProof = exports.generateZKProof = void 0;
const js_base64_1 = require("js-base64");
const credential_1 = require("./credential");
const circuit_1 = require("./circuit");
const tool_1 = require("./lib/tool");
const did_1 = require("./did");
/**
 * @remark This method generates a ZKProof instance based on a specific circuit code
 *         The contents in `zkCred` is always trusted by API for now.
 * @param zkCred - An instance of ZKCredential
 * @param code - The code of the circuit to apply
 * @returns An instance of ZKProof
 * @throws Error if circuit doesn't exist
 */
const generateZKProof = async (zkCred, code) => {
    // Real-world notes:
    // 1> Real-world proof generation needs actual credential data (the values decrypted by user) as input.
    await (0, tool_1.callApi)();
    // The circuit MUST exist and match the `code` provided
    const circuit = (0, circuit_1.getCircuit)(zkCred.purpose, code);
    if (code !== circuit.toCode()) {
        throw new Error(`Expected circuit code: '${code}', got '${circuit.toCode()}'.`);
    }
    // Set field `zkproof` as `zkCred.credential` and pretend that it's well encrypted (so verifier won't see/decode).
    return {
        code,
        proof: zkCred.credential,
        commitment: zkCred.commitment,
    };
};
exports.generateZKProof = generateZKProof;
/**
 * @remark This method generates a signed ZKProof with prover's signature (e.g. by Metamask)
 *         The contents in `zkCred` is always trusted by API for now.
 * @param zkCred - An instance of ZKCredential
 * @param code - The code of the circuit to apply
 * @returns An instance of SignedZKProof
 * @throws Error if circuit doesn't exist
 */
const _generateSignedZKProof = async (zkCred, code) => {
    // Generate zkproof body
    const body = await (0, exports.generateZKProof)(zkCred, code);
    // Sign and get signature (could be implememnted by Dapp).
    const signature = 'some_signature';
    return {
        body,
        signature,
    };
};
/**
 * @remark This method verifies a ZKProof instance
 * @param zkProof - The instance of ZKProof
 * @param prover - Prover's address
 * @param purpose - The purpose of proof
 * @returns Result of proof verification
 * @throws Error if verification fails
 */
const verifyZKProof = (zkProof, prover, purpose) => {
    //======================Basic check======================
    // 1> Fetch DID by `address` and fetch ZKCredential by `did` and `purpose`
    const did = (0, did_1.getDID)(prover);
    const zkCred = (0, credential_1.getZKCredential)(did, purpose);
    // 2> Verify `zkCred` itself (nothing to do for now since `zkCred` is always trusted by API)
    // Skip
    // 3> Prover can cheat by using a ZKProof generated by someone else.
    if (!(0, did_1.didEqual)(zkCred.did, did))
        throw Error('DID on credential is not matching prover DID');
    // 4> Prevent ZKCredential misuse
    if (zkCred.purpose !== purpose)
        throw Error('Credential is not matching the purpose');
    //======================ZK proof check===================
    // 5> Prevent cheating
    if (zkCred.commitment !== zkProof.commitment)
        throw Error('Commitment is not matching');
    // 6> The circuit MUST exist
    const circuit = (0, circuit_1.getCircuit)(purpose, zkProof.code);
    // 7> Decode `zkProof.proof` with Base64 and parse as object.
    // For simulation, verifier pretends that he/she can't see/decode any actual values.
    const credObj = JSON.parse(js_base64_1.Base64.decode(zkProof.proof));
    const fields = new Map();
    Object.entries(credObj).forEach(([field, value]) => {
        fields.set(field, value);
    });
    return circuit.verify(fields);
};
exports.verifyZKProof = verifyZKProof;
/**
 * @remark This method verifies a SignedZKProof instance
 * @param signed - The instance of SignedZKProof
 * @param purpose - The purpose of proof
 * @returns Result of proof verification
 * @throws Error if verification fails
 */
const _verifySignedZKProof = (signed, purpose) => {
    // 1> Recover signer(prover) `address` (could be implememnted by Dapp).
    const address = 'some_recovered_address';
    return (0, exports.verifyZKProof)(signed.body, address, purpose);
};
