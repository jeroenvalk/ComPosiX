module.exports = function ($) {

    const reverseKeys = function (entity) {
        let result, size, k;
        switch (Object.getPrototypeOf(entity)) {
            case Object.prototype:
                result = Object.keys(entity);
                size = result.length;
                k = size >> 1;
                for (let i = 0; i < k; ++i) {
                    let aux = result[--size];
                    result[size] = result[i];
                    result[i] = aux;
                }
                return result;
            case Array.prototype:
                size = k = entity.length;
                result = new Array(size);
                for (let i = 0; i < size; ++i) {
                    result[--k] = i;
                }
                return result;
            default:
                return null;
        }
    };

    const preorder = function (entity, keys) {
        const stack = [entity];
        let size = 1;
        return {
            count: -1,
            stack: stack,
            next: function () {
                ++this.count;
                if (size % 2) {
                    const entry = stack[--size];
                    stack.push(keys(entry));
                    size = stack.length;
                    return {value: entry, done: false};
                }
                let todo = stack[--size];
                while (!todo || !todo.length) {
                    if (size-- < 0) {
                        return {done: true};
                    }
                    stack.pop();
                    stack.pop();
                    todo = stack[--size];
                }
                const key = todo.pop();
                const entry = stack[--size][key];
                stack.push(entry);
                stack.push(keys(entry));
                size = stack.length;
                return {value: entry, done: false};
            }
        }
    };

    const returnReadable = function returnWritable(writable) {
        writable.end();
        writable[Symbol.iterator] = function () {

        };
        return writable;
    };

    $.preorder = function cpxIterators$preorder(entity, iterable) {
        const iterator = function () {
            const result = preorder(entity, reverseKeys);
            if (iterable !== entity) {
                iterable.iterator = result;
            }
            return result;
        };
        if (iterable) {
            if (!(iterable instanceof Object)) {
                iterable = {};
            }
        } else {
            iterable = entity;
        }
        iterable[Symbol.iterator] = iterator;
        return iterable;
    };

    $.iterableStream = function cpxIterator$iterableStream(options) {
        return new stream.PassThrough(options);
    };

    $.pipeIterable = function cpxIterator$pipeIterable(iterable, writable) {
        $.pipeIterator(iterable[Symbol.iterator](), writable).then(function (tree) {
            writable.end();
        });
        return writable;
    };

    $.pipeIterator = function cpxIterator$pipeIterator(iterator, writable) {
        const result = iterator.next();

        if (result.done) {
            return Promise.resolve([iterator, []]);
        }

        if (result.value instanceof Promise) {
            return result.value.then(function (iterable) {
                return $.pipeIterator(iterable[Symbol.iterator](), writable).then(function (tree) {
                    return $.pipeIterator(iterator, writable).then(function (pair) {
                        pair[1].push(tree);
                        return pair;
                    });
                });
            });
        }

        writable.write(result.value);
        return $.pipeIterator(iterator, writable);
    };

    var _ = {
        pipe: function core$pipe(readable, writable) {
            if (readable instanceof Object) {
                if (readable instanceof Promise) {
                    return readable.then(function (value) {
                        return _.pipe(value, writeable);
                    });
                }
                if (readable instanceof Buffer) {
                    writable.write(buffer);
                    return writable;
                }
                if (readable instanceof Array) {
                    throw new Error('not implemented');
                }
                if (readable.statusCode === 200) {
                    if (writeable.setHeader instanceof Function) {
                        _.each(readable.headers, function (value, key) {
                            writable.setHeader(key, value);
                        })
                    }
                    readable.pipe(writeable);
                    return writable;
                }
                throw new Error(readable.statusCode || 500);
            } else {
                writable.end();
            }
        }
    };

};
