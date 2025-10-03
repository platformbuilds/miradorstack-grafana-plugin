#!/bin/sh

if [ "${DEV}" = "false" ]; then
    echo "Starting test mode"
    exec /run.sh
fi

echo "Starting development mode"

# Copy the correct Go binary for the target architecture
if [ -f /var/lib/grafana/plugins/platformbuildspvtltd-miradorstackconnect-app/gpx_miradorstack_connect_linux_amd64 ]; then
    cp /var/lib/grafana/plugins/platformbuildspvtltd-miradorstackconnect-app/gpx_miradorstack_connect_linux_amd64 /var/lib/grafana/plugins/platformbuildspvtltd-miradorstackconnect-app/gpx_miradorstack_connect
elif [ -f /var/lib/grafana/plugins/platformbuildspvtltd-miradorstackconnect-app/gpx_miradorstack_connect_linux_arm64 ]; then
    cp /var/lib/grafana/plugins/platformbuildspvtltd-miradorstackconnect-app/gpx_miradorstack_connect_linux_arm64 /var/lib/grafana/plugins/platformbuildspvtltd-miradorstackconnect-app/gpx_miradorstack_connect
fi

if [ -f /var/lib/grafana/plugins/platformbuildspvtltd-miradorstackconnect-app/gpx_miradorstack_connect ]; then
    chmod +x /var/lib/grafana/plugins/platformbuildspvtltd-miradorstackconnect-app/gpx_miradorstack_connect
fi

if grep -i -q alpine /etc/issue; then
    exec /usr/bin/supervisord -c /etc/supervisord.conf
elif grep -i -q ubuntu /etc/issue; then
    exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
else
    echo 'ERROR: Unsupported base image'
    exit 1
fi

