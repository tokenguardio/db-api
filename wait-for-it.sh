#!/usr/bin/env bash

# Usage: wait-for-it.sh host:port [-- command args]
#   -h HOST | --host=HOST       Host or IP under test
#   -p PORT | --port=PORT       TCP port under test
#    -- COMMAND ARGS            Execute command with args after the test finishes

TIMEOUT=15
QUIET=0

echoerr() { if [ "$QUIET" -eq 0 ]; then echo "$@" 1>&2; fi }

wait_for() {
    for i in `seq $TIMEOUT` ; do
        nc -z "$HOST" "$PORT" > /dev/null 2>&1
        
        result=$?
        if [ $result -eq 0 ] ; then
            if [ $# -gt 0 ] ; then
                exec "$@"
            fi
            exit 0
        fi
        sleep 1
    done
    echo "Operation timed out" >&2
    exit 1
}

while [ $# -gt 0 ]
do
    case "$1" in
        *:* )
            HOST=`echo $1 | sed -e 's/:.*//'`
            PORT=`echo $1 | sed -e 's/.*://'`
            shift 1
        ;;
        --command)
            shift
            WAITFORIT_CLI=("$@")
            break
        ;;
        --help)
            usage
            exit 0
        ;;
        --quiet)
            QUIET=1
            shift 1
        ;;
        --timeout=*)
            TIMEOUT="${1#*=}"
            shift 1
        ;;
        --)
            shift
            WAITFORIT_CLI=("$@")
            break
        ;;
        -*)
            echoerr "Unknown argument: $1"
            exit 1
        ;;
        *)
            echoerr "Unknown argument: $1"
            exit 1
        ;;
    esac
done

if [ "$HOST" = "" -o "$PORT" = "" ]; then
    echoerr "Error: you need to provide a host and port to test."
    exit 1
fi

wait_for "$@"
