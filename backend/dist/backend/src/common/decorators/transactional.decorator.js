"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transactional = Transactional;
const TRANSACTION_OPTIONS = {
    maxWait: 5_000,
    timeout: 30_000,
};
function Transactional() {
    return (_target, propertyKey, descriptor) => {
        const original = descriptor.value;
        if (typeof original !== 'function') {
            throw new Error(`@Transactional can only decorate methods (${String(propertyKey)})`);
        }
        descriptor.value = function (...args) {
            const outer = this.prisma;
            if (!outer || typeof outer.$transaction !== 'function') {
                throw new Error(`@Transactional on ${String(propertyKey)}: this.prisma is not a PrismaClient`);
            }
            return outer.$transaction(async (tx) => {
                const scoped = new Proxy(this, {
                    get(target, prop, receiver) {
                        if (prop === 'prisma')
                            return tx;
                        return Reflect.get(target, prop, receiver);
                    },
                });
                return original.apply(scoped, args);
            }, TRANSACTION_OPTIONS);
        };
    };
}
//# sourceMappingURL=transactional.decorator.js.map