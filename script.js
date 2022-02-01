let parids = {"hostname1": {checkid: "subfolderid1", root: "rootid1"},
               "hostname2": {checkid: "subfolderid2", root: "rootid2"}};
let mail = "mymailaddr@gmail.com";

function checkLastCreation() {
  for (let p in parids) {
    let lastparents = getLastActiveParents(parids[p]["root"]);
    let found = false;

    for (let it of lastparents) {
      if (it == parids[p]["checkid"]) {
        found = true;
        break;
      }
    }

    if (!found) {
      MailApp.sendEmail({to: mail, subject: p + " didn't upload Backup since yesterday", body: ""});
    }
    else {
      MailApp.sendEmail({to: mail, subject: p + " did upload Backup", body: ""});
    }
  }
}

function getLastActiveParents(rootid) {
  const today = new Date();
  const yesterday = new Date(new Date().setDate(today.getDate() - 1));
  const yesterday_str = Utilities.formatDate(yesterday, 'GMT+01:00', "yyyy-MM-dd'T'HH:mm:ss.S'Z'");

  var ret = new Set([]);
  const request = {
    pageSize: 10,
    ancestor_name: "items/" + rootid
    // Use other parameter here if needed.
  };
  try {
    // Activity.query method is used Query past activity in Google Drive.
    const response = DriveActivity.Activity.query(request);
    const activities = response.activities;
    if (!activities || activities.length === 0) {
      Logger.log('No activity.');
      return ret;
    }
    //Logger.log('Recent activity: %s', activities.length);
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      // get time information of activity.
      const time = getTimeInfo(activity);
      if (time < yesterday_str) {
        continue;
      }
      // get the action details/information
      const action = getActionInfo(activity.primaryActionDetail);
      if (action != "create" && action != "edit") {
        continue;
      }

      for (let j = 0; j < activity.targets.length; ++j) {
        ret.add(extractParent(activity.targets[j]));
      }
    }
  } catch (err) {
    Logger.log('Failed with an error %s', err.message);
  }

  return ret;
}

function extractParent(target) {
  if ('driveItem' in target) {
    f = Drive.Files.get(target.driveItem.name.slice(6));
    parents = f.parents;

    for (let i = 0; i < parents.length; i++) {
      //Logger.log("found par: %s", parents[i].id);
      return parents[i].id;
    }
  }

  return 'unknonw';
}

/**
 * @param {object} object
 * @return {string}  Returns the name of a set property in an object, or else "unknown".
 */
function getOneOf(object) {
  for (const key in object) {
    return key;
  }
  return 'unknown';
}

/**
 * @param {object} activity Activity object.
 * @return {string} Returns a time associated with an activity.
 */
function getTimeInfo(activity) {
  if ('timestamp' in activity) {
    return activity.timestamp;
  }
  if ('timeRange' in activity) {
    return activity.timeRange.endTime;
  }
  return 'unknown';
}

/**
 * @param {object} actionDetail The primary action details of the activity.
 * @return {string} Returns the type of action.
 */
function getActionInfo(actionDetail) {
  return getOneOf(actionDetail);
}
