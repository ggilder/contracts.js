var _c;
let import = macro {
    rule { @ from $lib:lit } => {
        _c = <%= lib %>
    }
    rule { $rest ... } => {
        import $rest ...
    }
}
export import;

macro base_contract {
    rule { $name } => { _c.$name }
}

macro function_contract {
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
        opt $contract:any_contract
    } => {
        _c.optional($contract)
    }
}

macro any_contract {
    rule { $contract:function_contract } => { $contract }
    rule { $contract:object_contract } => { $contract }
    rule { $contract:array_contract } => { $contract }
    rule { $contract:repeat_contract } => { $contract }
    rule { $contract:optional_contract } => { $contract }
    rule { $contract:base_contract } => { $contract }
}


let @ = macro {
    case {_
          let $contractName = $contract:any_contract
    } => {
        return #{
            _c.$contractName = $contract;
        }
    }

	case {_
        $contracts:function_contract
		function $name ($params ...) { $body ...}
    } => {
        var nameStx = #{$name}[0];
        var nameStr = unwrapSyntax(nameStx);
        letstx $guardedName = [makeIdent("inner_" + nameStr, #{here})];
        letstx $client = [makeValue("function " + nameStr, #{here})];
        letstx $server = [makeValue("(calling context for " + nameStr + ")", #{here})];
        letstx $fnName = [makeValue(nameStr, #{here})];
        letstx $lineNumber = [makeValue(nameStx.token.sm_lineNumber, #{here})];
		return #{
            var $guardedName = ($contracts).proj(_c.Blame.create($fnName, $client, $server, $lineNumber))(function $name ($params ...) { $body ...});
            function $name ($params ...) {
                return $guardedName.apply(this, arguments);
            }
        }
	}
}
export @;
