package org.yamcs.activities;

import java.net.InetAddress;
import java.util.Map;

import org.yamcs.Processor;
import org.yamcs.mdb.MdbFactory;
import org.yamcs.security.User;

public class CommandExecution extends ActivityExecution {

    private Processor processor;
    private String commandName;
    private Map<String, Object> args;
    private User user;

    public CommandExecution(
            ActivityService activityService,
            CommandExecutor executor,
            Activity activity,
            Processor processor,
            String commandName,
            Map<String, Object> args,
            User user) {
        super(activityService, executor, activity);
        this.processor = processor;
        this.commandName = commandName;
        this.args = args;
        this.user = user;
    }

    @Override
    public Void run() throws Exception {
        var cmdManager = processor.getCommandingManager();

        var mdb = MdbFactory.getInstance(processor.getInstance());
        var cmd = mdb.getMetaCommand(commandName);

        var origin = InetAddress.getLocalHost().getHostName();
        var preparedCommand = cmdManager.buildCommand(cmd, args, origin, 0, user);
        cmdManager.sendCommand(user, preparedCommand);

        return null;
    }

    @Override
    public void stop() throws Exception {
        // NOP
    }
}
