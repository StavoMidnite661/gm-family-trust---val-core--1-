// Tango Card Adapter
export class TangoAdapter {
  async createCard(accountId: string) {
    return { success: true, cardId: 'tango-card-123' };
  }
}

// Arcus Bill-Pay Adapter
export class ArcusAdapter {
  async payBill(accountId: string, amount: number) {
    return { success: true, billId: 'arcus-bill-456' };
  }
}

// Moov Push-to-Card Adapter
export class MoovAdapter {
  async pushToCard(accountId: string, amount: number) {
    return { success: true, transferId: 'moov-transfer-789' };
  }
}
