var _c;
let import = macro {
    rule { @ from $lib:lit } => {
        _c = (function () {
    'use strict';
    if (typeof require === 'function') {
        // importing patches Proxy to be in line with the new direct proxies
        require('harmony-reflect');
    }
    var unproxy = new WeakMap();
    var typeVarMap = new WeakMap();
    var Blame = {
            create: function (name, pos, neg, lineNumber) {
                var o = new BlameObj(name, pos, neg, lineNumber);
                Object.freeze(o);
                return o;
            },
            clone: function (old, props) {
                var propsObj = {};
                for (var prop in props) {
                    if (props.hasOwnProperty(prop)) {
                        propsObj[prop] = { value: props[prop] };
                    }
                }
                var o = Object.create(old, propsObj);
                Object.freeze(o);
                return o;
            }
        };
    function BlameObj(name, pos, neg, lineNumber) {
        this.name = name;
        this.pos = pos;
        this.neg = neg;
        this.lineNumber = lineNumber;
    }
    BlameObj.prototype.swap = function () {
        return Blame.clone(this, {
            pos: this.neg,
            neg: this.pos
        });
    };
    BlameObj.prototype.addExpected = function (expected, override) {
        if (this.expected === undefined || override) {
            return Blame.clone(this, { expected: expected });
        }
        return Blame.clone(this, {});
    };
    BlameObj.prototype.addGiven = function (given) {
        return Blame.clone(this, { given: given });
    };
    BlameObj.prototype.addLocation = function (loc) {
        return Blame.clone(this, { loc: this.loc != null ? this.loc.concat(loc) : [loc] });
    };
    BlameObj.prototype.addParents = function (parent) {
        return Blame.clone(this, { parents: this.parents != null ? this.parents.concat(parent) : [parent] });
    };
    BlameObj.prototype.setNeg = function (neg) {
        return Blame.clone(this, { neg: neg });
    };
    function assert(cond, msg) {
        if (!cond) {
            throw new Error(msg);
        }
    }
    function Contract(name, type, proj) {
        this.name = name;
        this.type = type;
        this.proj = proj.bind(this);
    }
    Contract.prototype.toString = function toString() {
        return this.name;
    };
    function addQuotes(val) {
        if (typeof val === 'string') {
            return '\'' + val + '\'';
        }
        return val;
    }
    function raiseBlame(blame) {
        var lineMessage = blame.lineNumber !== undefined ? 'function ' + blame.name + ' guarded at line: ' + blame.lineNumber + '\n' : '';
        var msg = blame.name + ': contract violation\n' + 'expected: ' + blame.expected + '\n' + 'given: ' + addQuotes(blame.given) + '\n' + 'in: ' + blame.loc.slice().reverse().join('\n    ') + '\n' + '    ' + blame.parents[0] + '\n' + lineMessage + 'blaming: ' + blame.pos + '\n';
        throw new Error(msg);
    }
    function makeCoffer(name) {
        return new Contract(name, 'coffer', function (blame, unwrapTypeVar, projOptions) {
            return function (val) {
                var locationMsg = 'in the type variable ' + name + ' of';
                if (unwrapTypeVar) {
                    if (val && typeof val === 'object' && unproxy.has(val)) {
                        var unwraperProj = typeVarMap.get(this).contract.proj(blame.addLocation(locationMsg));
                        return unwraperProj(unproxy.get(val));
                    } else {
                        raiseBlame(blame.addExpected('an opaque value').addGiven(val).addLocation(locationMsg));
                    }
                } else {
                    var towrap = val && typeof val === 'object' ? val : {};
                    var p = new Proxy(towrap, {
                            getOwnPropertyDescriptor: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called Object.getOwnPropertyDescriptor').addLocation(locationMsg));
                            },
                            getOwnPropertyName: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called Object.getOwnPropertyName').addLocation(locationMsg));
                            },
                            defineProperty: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called Object.defineProperty').addLocation(locationMsg));
                            },
                            deleteProperty: function (target, propName) {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called delete on property' + propName).addLocation(locationMsg));
                            },
                            freeze: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called Object.freeze').addLocation(locationMsg));
                            },
                            seal: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called Object.seal').addLocation(locationMsg));
                            },
                            preventExtensions: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called Object.preventExtensions').addLocation(locationMsg));
                            },
                            has: function (target, propName) {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called `in` for property ' + propName).addLocation(locationMsg));
                            },
                            hasOwn: function (target, propName) {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called Object.hasOwnProperty on property ' + propName).addLocation(locationMsg));
                            },
                            get: function (target, propName) {
                                var givenMsg = 'performed obj.' + propName;
                                if (propName === 'valueOf') {
                                    givenMsg = 'attempted to inspect the value';
                                }
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven(givenMsg).addLocation(locationMsg));
                            },
                            set: function (target, propName, val$2) {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('performed obj.' + propName + ' = ' + val$2).addLocation(locationMsg));
                            },
                            enumerate: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('value used in a `for in` loop').addLocation(locationMsg));
                            },
                            iterate: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('value used in a `for of` loop').addLocation(locationMsg));
                            },
                            keys: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('called Object.keys').addLocation(locationMsg));
                            },
                            apply: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('attempted to invoke the value').addLocation(locationMsg));
                            },
                            construct: function () {
                                raiseBlame(blame.swap().addExpected('value to not be manipulated').addGiven('attempted to invoke the value with new').addLocation(locationMsg));
                            }
                        });
                    if (!typeVarMap.has(this)) {
                        var valType = typeof val;
                        var inferedContract = check(function (checkVal) {
                                return typeof checkVal === valType;
                            }, '(x) => typeof x === \'' + valType + '\'');
                        typeVarMap.set(this, { contract: inferedContract });
                    } else {
                        var inferedProj = typeVarMap.get(this).contract.proj(blame.addLocation(locationMsg));
                        inferedProj(val);
                    }
                    unproxy.set(p, val);
                    return p;
                }
            }.bind(this);
        });
    }
    function check(predicate, name) {
        var c = new Contract(name, 'check', function (blame) {
                return function (val) {
                    if (predicate(val)) {
                        return val;
                    } else {
                        raiseBlame(blame.addExpected(name).addGiven(val));
                    }
                };
            });
        return c;
    }
    function addTh(a0) {
        if (a0 === 0) {
            return '0th';
        }
        if (a0 === 1) {
            return '1st';
        }
        if (a0 === 2) {
            return '2nd';
        }
        if (a0 === 3) {
            return '3rd';
        }
        var x = a0;
        return x + 'th';
    }
    function pluralize(a0, a1) {
        if (a0 === 0) {
            var str = a1;
            return str + 's';
        }
        if (a0 === 1) {
            var str = a1;
            return str;
        }
        var n = a0;
        var str = a1;
        return str + 's';
    }
    function toContract(f) {
        return check(f, function () {
            if (f.name) {
                return f.name;
            } else {
                return 'custom contract';
            }
        }.bind(this)());
    }
    function fun(domRaw, rngRaw, options) {
        var dom = domRaw.map(function (d) {
                if (!(d instanceof Contract)) {
                    if (typeof d === 'function') {
                        return toContract(d);
                    }
                    throw new Error(d + ' is not a contract');
                }
                return d;
            });
        var domStr = dom.map(function (d, idx) {
                return options && options.namesStr ? options.namesStr[idx] + ': ' + d : d;
            }).join(', ');
        var domName = '(' + domStr + ')';
        var rng = rngRaw;
        if (!(rngRaw instanceof Contract)) {
            if (typeof rngRaw === 'function') {
                rng = toContract(rngRaw);
            } else {
                throw new Error(rng + ' is not a contract');
            }
        }
        var rngStr = options && options.namesStr ? options.namesStr[options.namesStr.length - 1] + ': ' + rng : rng;
        var thisName = options && options.thisContract ? '\n    | this: ' + options.thisContract : '';
        var contractName = domName + ' -> ' + rngStr + thisName + (options && options.dependencyStr ? ' | ' + options.dependencyStr : '');
        var c = new Contract(contractName, 'fun', function (blame, unwrapTypeVar, projOptions) {
                return function (f) {
                    blame = blame.addParents(contractName);
                    if (typeof f !== 'function') {
                        raiseBlame(blame.addExpected('a function that takes ' + dom.length + pluralize(dom.length, ' argument')).addGiven(f));
                    }
                    function applyTrap(target, thisVal, args) {
                        var checkedArgs = [];
                        var depArgs = [];
                        for (var i = 0; i < dom.length; i++) {
                            if (dom[i].type === 'optional' && args[i] === undefined) {
                                continue;
                            } else {
                                var location = 'the ' + addTh(i + 1) + ' argument of';
                                var unwrapForProj = dom[i].type === 'fun' ? !unwrapTypeVar : unwrapTypeVar;
                                var domProj = dom[i].proj(blame.swap().addLocation(location), unwrapForProj);
                                checkedArgs.push(domProj(args[i]));
                                if (options && options.dependency) {
                                    var depProj = dom[i].proj(blame.swap().setNeg('the contract of ' + blame.name).addLocation(location));
                                    depArgs.push(depProj(args[i]));
                                }
                            }
                        }
                        checkedArgs = checkedArgs.concat(args.slice(i));
                        var checkedThis = thisVal;
                        if (options && options.thisContract || projOptions && projOptions.overrideThisContract) {
                            var thisContract = function () {
                                    if (projOptions && projOptions.overrideThisContract) {
                                        return projOptions.overrideThisContract;
                                    } else {
                                        return options.thisContract;
                                    }
                                }.bind(this)();
                            var thisProj = thisContract.proj(blame.swap().addLocation('the this value of'));
                            checkedThis = thisProj(thisVal);
                        }
                        assert(rng instanceof Contract, 'The range is not a contract');
                        var rawResult = target.apply(checkedThis, checkedArgs);
                        var rngUnwrap = rng.type === 'fun' ? unwrapTypeVar : !unwrapTypeVar;
                        var rngProj = rng.proj(blame.addLocation('the return of'), rngUnwrap);
                        var rngResult = rngProj(rawResult);
                        if (options && options.dependency && typeof options.dependency === 'function') {
                            var depResult = options.dependency.apply(this, depArgs.concat(rngResult));
                            if (!depResult) {
                                raiseBlame(blame.addExpected(options.dependencyStr).addGiven(false).addLocation('the return dependency of'));
                            }
                        }
                        return rngResult;
                    }
                    // only use expensive proxies when needed (to distinguish between apply and construct)
                    if (options && options.needs_proxy) {
                        var p = new Proxy(f, {
                                apply: function (target, thisVal, args) {
                                    return applyTrap(target, thisVal, args);
                                }
                            });
                        return p;
                    } else {
                        return function () {
                            return applyTrap(f, this, Array.prototype.slice.call(arguments));
                        };
                    }
                };
            });
        return c;
    }
    function optional(contract, options) {
        if (!(contract instanceof Contract)) {
            if (typeof contract === 'function') {
                contract = toContract(contract);
            } else {
                throw new Error(contract + ' is not a contract');
            }
        }
        var contractName = '?' + contract;
        return new Contract(contractName, 'optional', function (blame, unwrapTypeVar) {
            return function (val) {
                var proj = contract.proj(blame, unwrapTypeVar);
                return proj(val);
            };
        });
    }
    function repeat(contract, options) {
        if (!(contract instanceof Contract)) {
            if (typeof contract === 'function') {
                contract = toContract(contract);
            } else {
                throw new Error(contract + ' is not a contract');
            }
        }
        var contractName = '....' + contract;
        return new Contract(contractName, 'repeat', function (blame, unwrapTypeVar) {
            return function (val) {
                var proj = contract.proj(blame, unwrapTypeVar);
                return proj(val);
            };
        });
    }
    function array(arrContractRaw, options) {
        var proxyPrefix = options && options.proxy ? '!' : '';
        var arrContract = arrContractRaw.map(function (c$2) {
                if (!(c$2 instanceof Contract)) {
                    if (typeof c$2 === 'function') {
                        return toContract(c$2);
                    }
                    throw new Error(c$2 + ' is not a contract');
                }
                return c$2;
            });
        var contractName = proxyPrefix + '[' + arrContract.map(function (c$2) {
                return c$2;
            }).join(', ') + ']';
        var contractNum = arrContract.length;
        var c = new Contract(contractName, 'array', function (blame, unwrapTypeVar) {
                return function (arr) {
                    if (typeof arr === 'number' || typeof arr === 'string' || typeof arr === 'boolean' || arr == null) {
                        raiseBlame(blame.addGiven(arr).addExpected('an array with at least ' + contractNum + pluralize(contractNum, ' field')));
                    }
                    for (var ctxIdx = 0, arrIdx = 0; ctxIdx < arrContract.length; ctxIdx++) {
                        if (arrContract[ctxIdx].type === 'repeat' && arr.length <= ctxIdx) {
                            break;
                        }
                        var unwrapForProj = arrContract[ctxIdx].type === 'fun' ? !unwrapTypeVar : unwrapTypeVar;
                        var fieldProj = arrContract[ctxIdx].proj(blame.addLocation('the ' + addTh(arrIdx) + ' field of'), unwrapForProj);
                        var checkedField = fieldProj(arr[arrIdx]);
                        arr[arrIdx] = checkedField;
                        arrIdx++;
                        if (arrContract[ctxIdx].type === 'repeat') {
                            if (ctxIdx !== arrContract.length - 1) {
                                throw new Error('The repeated contract must come last in ' + contractName);
                            }
                            for (; arrIdx < arr.length; arrIdx++) {
                                var repeatProj = arrContract[ctxIdx].proj(blame.addLocation('the ' + addTh(arrIdx) + ' field of'), unwrapForProj);
                                arr[arrIdx] = repeatProj(arr[arrIdx]);
                            }
                        }
                    }
                    if (options && options.proxy) {
                        return new Proxy(arr, {
                            set: function (target, key, value) {
                                var lastContract = arrContract[arrContract.length - 1];
                                var fieldProj$2;
                                if (arrContract[key] !== undefined && arrContract[key].type !== 'repeat') {
                                    fieldProj$2 = arrContract[key].proj(blame.swap().addLocation('the ' + addTh(key) + ' field of'));
                                    target[key] = fieldProj$2(value);
                                } else if (lastContract && lastContract.type === 'repeat') {
                                    fieldProj$2 = lastContract.proj(blame.swap().addLocation('the ' + addTh(key) + ' field of'));
                                    target[key] = fieldProj$2(value);
                                }
                            }
                        });
                    } else {
                        return arr;
                    }
                };
            });
        return c;
    }
    function object(objContract, options) {
        var contractKeys = Object.keys(objContract);
        contractKeys.forEach(function (prop) {
            if (!(objContract[prop] instanceof Contract)) {
                if (typeof objContract[prop] === 'function') {
                    objContract[prop] = toContract(objContract[prop]);
                } else {
                    throw new Error(objContract[prop] + ' is not a contract');
                }
            }
        });
        var proxyPrefix = options && options.proxy ? '!' : '';
        var contractName = proxyPrefix + '{' + contractKeys.map(function (prop) {
                return prop + ': ' + objContract[prop];
            }).join(', ') + '}';
        var keyNum = contractKeys.length;
        var c = new Contract(contractName, 'object', function (blame) {
                return function (obj) {
                    if (typeof obj === 'number' || typeof obj === 'string' || typeof obj === 'boolean' || obj == null) {
                        raiseBlame(blame.addGiven(obj).addExpected('an object with at least ' + keyNum + pluralize(keyNum, ' key')));
                    }
                    contractKeys.forEach(function (key) {
                        if (!(objContract[key].type === 'optional' && obj[key] === undefined)) {
                            // self contracts use the original object contract
                            var c$2 = objContract[key];
                            var propProjOptions = function () {
                                    if (objContract[key].type === 'fun') {
                                        return { overrideThisContract: this };
                                    } else {
                                        return {};
                                    }
                                }.bind(this)();
                            // var c = objContract[key].type === "self" ? this : objContract[key];
                            var propProj = c$2.proj(blame.addLocation('the ' + key + ' property of'), false, propProjOptions);
                            var checkedProperty = propProj(obj[key]);
                            obj[key] = checkedProperty;
                        }
                    }.bind(this));
                    if (options && options.proxy) {
                        return new Proxy(obj, {
                            set: function (target, key, value) {
                                if (objContract.hasOwnProperty(key)) {
                                    var propProj = objContract[key].proj(blame.swap().addLocation('setting the ' + key + ' property of'));
                                    var checkedProperty = propProj(value);
                                    target[key] = checkedProperty;
                                } else {
                                    target[key] = value;
                                }
                            }
                        });
                    } else {
                        return obj;
                    }
                }.bind(this);
            });
        return c;
    }
    function self() {
        var name = 'self';
    }
    function or(left, right) {
        if (!(left instanceof Contract)) {
            if (typeof left === 'function') {
                left = toContract(left);
            } else {
                throw new Error(left + ' is not a contract');
            }
        }
        if (!(right instanceof Contract)) {
            if (typeof right === 'function') {
                right = toContract(right);
            } else {
                throw new Error(right + ' is not a contract');
            }
        }
        var contractName = left + ' or ' + right;
        return new Contract(contractName, 'or', function (blame) {
            return function (val) {
                try {
                    var leftProj = left.proj(blame.addExpected(contractName, true));
                    return leftProj(val);
                } catch (b) {
                    var rightProj = right.proj(blame.addExpected(contractName, true));
                    return rightProj(val);
                }
            };
        });
    }
    function guard(contract, value, name) {
        var proj = contract.proj(Blame.create(name, 'function ' + name, '(calling context for ' + name + ')'));
        return proj(value);
    }
    return {
        Num: check(function (val) {
            return typeof val === 'number';
        }, 'Num'),
        Str: check(function (val) {
            return typeof val === 'string';
        }, 'Str'),
        Bool: check(function (val) {
            return typeof val === 'boolean';
        }, 'Bool'),
        Odd: check(function (val) {
            return val % 2 === 1;
        }, 'Odd'),
        Even: check(function (val) {
            return val % 2 !== 1;
        }, 'Even'),
        Pos: check(function (val) {
            return val >= 0;
        }, 'Pos'),
        Nat: check(function (val) {
            return val > 0;
        }, 'Nat'),
        Neg: check(function (val) {
            return val < 0;
        }, 'Neg'),
        Any: check(function (val) {
            return true;
        }, 'Any'),
        None: check(function (val) {
            return false;
        }, 'None'),
        Null: check(function (val) {
            return null === val;
        }, 'Null'),
        Undefined: check(function (val) {
            return void 0 === val;
        }, 'Null'),
        Void: check(function (val) {
            return null == val;
        }, 'Null'),
        check: check,
        fun: fun,
        or: or,
        self: new Contract('self', 'self', function (b) {
            return function () {
            };
        }),
        repeat: repeat,
        optional: optional,
        object: object,
        array: array,
        Blame: Blame,
        makeCoffer: makeCoffer,
        guard: guard
    };
}());
    }
    rule { $rest ... } => {
        import $rest ...
    }
}
export import;

macro stringify {
    case {_ ($toks ...) } => {
        var toks = #{$toks ...}[0].token.inner;

        function traverse(stx) {
            return stx.map(function(s) {
                if (s.token.inner) {
                    return s.token.value[0] + traverse(s.token.inner) + s.token.value[1];
                }
                return s.token.value;
            }).join(" ");
        }

        var toksStr = traverse(toks);
        letstx $str = [makeValue(toksStr, #{here})];
        return #{$str}
    }
}

macro base_contract {
    rule { $name } => { typeof $name !== 'undefined' ? $name : _c.$name }
}

macroclass named_contract {
    rule { $name $[:] $contract:any_contract }
}

macro function_contract {
    rule { ($dom:named_contract (,) ...) this $this:object_contract -> $range:named_contract | { $guard ... } } => {
        _c.fun([$dom$contract (,) ...], $range$contract, {
            dependency: function($dom$name (,) ..., $range$name) {
                $guard ...
            },
            thisContract: $this,
            namesStr: [$(stringify (($dom$name))) (,) ..., stringify (($range$name))],
            dependencyStr: stringify (($guard ...))
        })
    }
    rule { ($dom:named_contract (,) ...) -> $range:named_contract | { $guard ... } } => {
        _c.fun([$dom$contract (,) ...], $range$contract, {
            dependency: function($dom$name (,) ..., $range$name) {
                $guard ...
            },
            namesStr: [$(stringify (($dom$name))) (,) ..., stringify (($range$name))],
            dependencyStr: stringify (($guard ...))
        })
    }
    rule { ($dom:named_contract (,) ...) this $this:object_contract -> $range:named_contract | $guard:expr } => {
        _c.fun([$dom$contract (,) ...], $range$contract, {
            dependency: function($dom$name (,) ..., $range$name) {
                return $guard;
            },
            thisContract: $this,
            namesStr: [$(stringify (($dom$name))) (,) ..., stringify (($range$name))],
            dependencyStr: stringify ($guard)
        })
    }
    rule { ($dom:named_contract (,) ...) -> $range:named_contract | $guard:expr } => {
        _c.fun([$dom$contract (,) ...], $range$contract, {
            dependency: function($dom$name (,) ..., $range$name) {
                return $guard;
            },
            namesStr: [$(stringify (($dom$name))) (,) ..., stringify (($range$name))],
            dependencyStr: stringify ($guard)
        })
    }
    rule { ($dom:any_contract (,) ...) -> $range:any_contract | this $[:] $this:object_contract } => {
        _c.fun([$dom (,) ...], $range, {
            thisContract: $this
        })
    }
    rule { ($dom:any_contract (,) ...) -> $range:any_contract } => {
        _c.fun([$dom (,) ...], $range)
    }
}

macro object_contract {
    rule { {
        $($prop $[:] $contract:any_contract) (,) ...
    } } => {
        _c.object({
            $($prop : $contract) (,) ...
        })
    }
    // proxied objects
    rule { !{
        $($prop $[:] $contract:any_contract) (,) ...
    } } => {
        _c.object({
            $($prop : $contract) (,) ...
        }, {proxy: true})
    }
}

macro array_contract {
    rule { [
        $contracts:any_contract (,) ...
    ] } => {
        _c.array([$contracts (,) ...])
    }
    // proxied arrays
    rule { ![
        $contracts:any_contract (,) ...
    ] } => {
        _c.array([$contracts (,) ...], {proxy: true})
    }
}

macro repeat_contract {
    rule {$[...] $contract:any_contract } => {
        _c.repeat($contract)
    }
}

macro optional_contract {
    rule {
        ? $contract:any_contract
    } => {
        _c.optional($contract)
    }
}

macro predicate_contract {
    rule {
        ($param) => { $pred ... }
    } => {
        _c.check(function($param) { $pred ... }, stringify (($pred ...)) )
    }

    rule {
        ($param) => $pred:expr
    } => {
        _c.check(function($param) { return $pred; }, stringify ($pred) )
    }
}


macro non_or_contract {
    rule { $contract:predicate_contract } => { $contract }
    rule { $contract:function_contract }  => { $contract }
    rule { $contract:object_contract }    => { $contract }
    rule { $contract:array_contract }     => { $contract }
    rule { $contract:repeat_contract }    => { $contract }
    rule { $contract:optional_contract }  => { $contract }
    rule { $contract:base_contract }      => { $contract }
}

macro or_contract {
    rule { $left:non_or_contract or $right:any_contract } => {
        _c.or($left, $right)
    }
}

macro any_contract {
    rule { $contract:or_contract }     => { $contract }
    rule { $contract:non_or_contract } => { $contract }
}


let @ = macro {
    // special casing let bound predicate contracts to get the name
    // from the let binding instead of doing stringify to the predicate body
    case {_
         let $contractName = ($param) => { $pred ... }
    } => {
        return #{
            _c.$contractName = _c.check(function($param) { $pred ...},
                                        stringify (($contractName)))
        }
    }
    case {_
         let $contractName = ($param) => $pred:expr
    } => {
        return #{
            _c.$contractName = _c.check(function($param) { return $pred },
                                        stringify (($contractName)))
        }
    }
    case {_
          let $contractName = $contract:any_contract
    } => {
        return #{
            _c.$contractName = $contract;
        }
    }

    case {_
        forall $($varName (,) ...)
        $contracts:function_contract
        function $name ($params ...) { $body ...}
    } => {
        return #{
            function $name ($params ...) {
                $body ...
            }
        }
    }

    case {_
        $contracts:function_contract
        function $name ($params ...) { $body ...}
    } => {
        return #{
            function $name ($params ...) {
                $body ...
            }
        }
    }
}
export @;