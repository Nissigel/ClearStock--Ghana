package com.clearstock.backend.common;

import java.net.InetSocketAddress;
import java.net.Socket;

/**
 * Whether this host can open a TCP connection to a mail relay at all.
 *
 * Hosts commonly block outbound SMTP to stop spam, and the block is usually
 * per-port — so a relay offering a non-standard port can still work where the
 * usual ones are dead. This reports which, rather than guessing.
 */
public final class PortProbe {

    private PortProbe() {
    }

    public static String check(String host, int port, int timeoutMs) {
        try (Socket socket = new Socket()) {
            long start = System.currentTimeMillis();
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            return "REACHABLE in " + (System.currentTimeMillis() - start) + "ms";
        } catch (Exception e) {
            return "BLOCKED (" + e.getClass().getSimpleName() + ")";
        }
    }
}
