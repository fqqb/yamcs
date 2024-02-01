package org.yamcs.activities;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.yamcs.YamcsServer;
import org.yamcs.security.User;

import com.google.common.base.CharMatcher;

public class ScriptExecution extends ActivityExecution {

    private Path script;
    private List<String> scriptArgs;
    private User user;

    private Process process;

    public ScriptExecution(
            ActivityService activityService,
            ScriptExecutor executor,
            Activity activity,
            Path script,
            List<String> scriptArgs,
            User user) {
        super(activityService, executor, activity);
        this.script = script;
        this.scriptArgs = scriptArgs;
        this.user = user;
    }

    @Override
    public Void run() throws Exception {
        var cmdline = script.toString();
        for (var arg : scriptArgs) {
            cmdline += " " + arg;
        }

        var yamcs = YamcsServer.getServer();
        var securityStore = yamcs.getSecurityStore();

        String apiKey = null;
        if (securityStore.isEnabled()) {
            apiKey = securityStore.generateApiKey(user.getName());
        }

        try {
            var pb = new ProcessBuilder(cmdline.split("\\s+"));
            pb.environment().put("YAMCS", "1");
            pb.environment().put("YAMCS_INSTANCE", yamcsInstance);
            if (apiKey != null) {
                pb.environment().put("YAMCS_API_KEY", apiKey);
            }

            pb.redirectErrorStream();
            process = pb.start();

            var infoMessage = "Started process, pid=" + process.pid();
            logServiceInfo(infoMessage);

            try (var reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                reader.lines().forEach(line -> {
                    line = CharMatcher.whitespace().trimTrailingFrom(line);
                    logActivityInfo(line);
                });
            }

            process.waitFor();
            var exitValue = process.exitValue();
            if (exitValue != 0) {
                var errorMessage = "Process returned with exit value " + exitValue;
                logServiceError(errorMessage);
                throw new RuntimeException(errorMessage);
            }
            return null;
        } finally {
            if (apiKey != null) {
                securityStore.removeApiKey(apiKey);
            }
        }
    }

    @Override
    public void stop() throws Exception {
        if (process != null && process.isAlive()) {
            log.debug("Destroying process {}", process.pid());
            process.destroy();
            process.onExit().get(2000, TimeUnit.MILLISECONDS);
            if (process.isAlive()) {
                log.debug("Forcing destroy of process {}", process.pid());
                process.destroyForcibly();
                process.onExit().get();
            }
        }
    }
}
