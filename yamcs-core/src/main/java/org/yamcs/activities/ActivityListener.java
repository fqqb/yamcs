package org.yamcs.activities;

@FunctionalInterface
public interface ActivityListener {

    /**
     * An activity is created or updated
     */
    void onUpdate(Activity activity);
}
