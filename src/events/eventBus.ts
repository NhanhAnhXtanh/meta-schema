type EventHandler<T = any> = (data: T) => void;

class EventBus {
    private listeners: { [key: string]: EventHandler[] } = {};

    on<T>(event: string, handler: EventHandler<T>): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
    }

    off<T>(event: string, handler: EventHandler<T>): void {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }

    emit<T>(event: string, data?: T): void {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(handler => handler(data));
    }
}

export const schemaEventBus = new EventBus();
