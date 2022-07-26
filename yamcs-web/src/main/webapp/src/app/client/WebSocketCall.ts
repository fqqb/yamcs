import { ServerMessage, WebSocketClient } from './WebSocketClient';

/**
 * A single API call on a WebSocket client.
 * Multiple calls may be active on the same WebSocket connection.
 */
export class WebSocketCall<O, D> {

  private _id?: number;
  private seq = 0; // Mirror of received seq count on server messages
  private _frameLoss = false;
  private frameLossListeners = new Set<() => void>();

  constructor(
    private client: WebSocketClient,
    private requestId: number,
    private type: string,
    private observer: (data: D) => void,
  ) { }

  /**
   * Returns the server-assigned unique call id
   */
  get id() {
    return this._id;
  }

  /**
   * True if a WebSocket frame loss was detected specific to this call
   * (at any point during this call).
   */
  get frameLoss() {
    return this._frameLoss;
  }

  /**
   * Receive a notification when a frame loss is detected. Only one
   * such notification is sent.
   */
  addFrameLossListener(frameLossListener: () => void) {
    this.frameLossListeners.add(frameLossListener);
  }

  removeFrameLossListener(frameLossListener: () => void) {
    this.frameLossListeners.delete(frameLossListener);
  }

  sendMessage(options: O) {
    if (this._id !== undefined) {
      this.client.sendMessage({
        type: this.type,
        call: this._id,
        options,
      });
    } else {
      this.client.sendMessage({
        type: this.type,
        id: this.requestId,
        options,
      });
    }
  }

  consume(msg: ServerMessage) {
    // Yamcs will always send a reply before any other call-related data
    if (msg.type === 'reply' && msg.data.replyTo === this.requestId) {
      this._id = msg.call;
      if (msg.data.exception) {
        const errCode = msg.data.exception['code'];
        const errType = msg.data.exception['type'];
        const errDetail = msg.data.exception['msg'];
        console.error(`Received ${errCode} ${errType} for topic '${this.type}': ${errDetail}`);
      }
    } else if (msg.type === this.type && msg.call === this.id) {
      if (!this.frameLoss && (this.seq + 1 !== msg.seq)) {
        this._frameLoss = true;
        this.frameLossListeners.forEach(listener => listener());
      }
      this.seq = msg.seq;
      this.observer(msg.data);
    }
  }

  cancel() {
    this.client.cancelCall(this);
    this.frameLossListeners.clear();
  }
}
