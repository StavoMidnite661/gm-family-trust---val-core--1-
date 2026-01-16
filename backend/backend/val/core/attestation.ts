
import { id, hexlify, randomBytes, Wallet, verifyMessage } from 'ethers';
import { CreditEvent, Attestation, AttestationProof } from '../events/types';

export class AttestationEngine {
  private signer: Wallet;
  
  constructor(privateKey: string) {
    this.signer = new Wallet(privateKey);
  }
  
  async attest(event: CreditEvent): Promise<Attestation> {
    const proof = await this.generateProof(event);
    const message = this.createAttestationMessage(event, proof);
    const signature = await this.signer.signMessage(message);
    
    return {
      id: id(`${event.id}-${Date.now()}`),
      eventId: event.id,
      signature,
      attestor: this.signer.address,
      timestamp: new Date(),
      proof
    };
  }
  
  async verify(attestation: Attestation, event: CreditEvent): Promise<boolean> {
    try {
      const message = this.createAttestationMessage(event, attestation.proof);
      const recoveredAddress = verifyMessage(message, attestation.signature);
      
      if (recoveredAddress.toLowerCase() !== attestation.attestor.toLowerCase()) {
        return false;
      }
      
      const expectedRoot = id(`${attestation.proof.eventHash}${attestation.proof.nonce}`);
      if (attestation.proof.merkleRoot !== expectedRoot) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }
  
  private async generateProof(event: CreditEvent): Promise<AttestationProof> {
    const eventHash = id(JSON.stringify({
      id: event.id,
      type: event.type,
      userId: event.userId,
      amount: event.amount.toString(),
      timestamp: event.timestamp.toISOString()
    }));
    
    const nonce = hexlify(randomBytes(32));
    const merkleRoot = id(`${eventHash}${nonce}`);
    
    return {
      merkleRoot,
      merkleProof: [],
      eventHash,
      nonce
    };
  }
  
  private createAttestationMessage(event: CreditEvent, proof: AttestationProof): string {
    return JSON.stringify({
      eventId: event.id,
      userId: event.userId,
      amount: event.amount.toString(),
      type: event.type,
      merkleRoot: proof.merkleRoot,
      timestamp: event.timestamp.toISOString()
    });
  }
}
