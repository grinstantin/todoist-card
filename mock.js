const mockConfig = {
  "entity": "sensor:todoist",
  "show_completed": true,
  "show_header": true,
  "show_item_add": true,
  "use_quick_add": false,
  "show_item_close": true,
  "show_item_delete": true,
  "only_today_overdue": false
};

const mockHass = {
  "states": {
    "sensor:todoist": {
      "attributes": {
        "project": {
          "child_order": 1,
          "collapsed": false,
          "color": "grey",
          "created_at": "2023-10-30T11:55:02Z",
          "id": '2322793986',
          "is_archived": false,
          "is_deleted": false,
          "is_favorite": false,
          "name": "Home 🏡",
          "parent_id": null,
          "shared": false,
          "sync_id": null,
          "updated_at": "2023-10-30T11:55:02Z",
          "view_style": "board"
        },
        "items": [
          {
            "added_at": "2023-11-01T12:29:40.692017Z",
            "added_by_uid": "46873680",
            "assigned_by_uid": null,
            "checked": false,
            "child_order": -5,
            "collapsed": false,
            "completed_at": null,
            "content": "Köp robotdammsugare",
            "description": "",
            "due": null,
            "duration": null,
            "id": "7369801448",
            "is_deleted": false,
            "labels": [],
            "note_count": 0,
            "parent_id": null,
            "priority": 1,
            "project_id": "2322793986",
            "responsible_uid": null,
            "section_id": "138441573",
            "sync_id": null,
            "updated_at": "2023-11-01T13:53:22Z",
            "user_id": "46873680"
          },
          {
            "added_at": "2023-11-01T13:46:10.849666Z",
            "added_by_uid": "46873680",
            "assigned_by_uid": null,
            "checked": false,
            "child_order": -4,
            "collapsed": false,
            "completed_at": null,
            "content": "Luftfuktare",
            "description": "",
            "due": null,
            "duration": null,
            "id": "7370027285",
            "is_deleted": false,
            "labels": [],
            "note_count": 0,
            "parent_id": null,
            "priority": 1,
            "project_id": "2322793986",
            "responsible_uid": null,
            "section_id": "138441573",
            "sync_id": null,
            "updated_at": "2023-11-01T13:53:22Z",
            "user_id": "46873680"
          },
          {
            "added_at": "2023-11-01T13:48:33.899477Z",
            "added_by_uid": "46873680",
            "assigned_by_uid": null,
            "checked": false,
            "child_order": -3,
            "collapsed": false,
            "completed_at": null,
            "content": "Fixa belysning i köket",
            "description": "Kolla smart strömbrytare",
            "due": null,
            "duration": null,
            "id": "7370034646",
            "is_deleted": false,
            "labels": [],
            "note_count": 0,
            "parent_id": null,
            "priority": 1,
            "project_id": "2322793986",
            "responsible_uid": null,
            "section_id": "138441573",
            "sync_id": null,
            "updated_at": "2023-11-01T13:53:24Z",
            "user_id": "46873680"
          },
          {
            "added_at": "2023-11-01T13:49:11.206172Z",
            "added_by_uid": "46873680",
            "assigned_by_uid": null,
            "checked": false,
            "child_order": -2,
            "collapsed": false,
            "completed_at": null,
            "content": "Skjutdörrar",
            "description": "",
            "due": null,
            "duration": null,
            "id": "7370036391",
            "is_deleted": false,
            "labels": [],
            "note_count": 0,
            "parent_id": null,
            "priority": 1,
            "project_id": "2322793986",
            "responsible_uid": null,
            "section_id": "138441573",
            "sync_id": null,
            "updated_at": "2023-11-01T13:53:24Z",
            "user_id": "46873680"
          },
          {
            "added_at": "2023-10-30T11:55:03.226473Z",
            "added_by_uid": "46873680",
            "assigned_by_uid": null,
            "checked": false,
            "child_order": 1,
            "collapsed": false,
            "completed_at": null,
            "content": "Add more content",
            "description": "Eg: daily, weekly, month tasks",
            "due": null,
            "duration": null,
            "id": "7362904952",
            "is_deleted": false,
            "labels": [],
            "note_count": 0,
            "parent_id": null,
            "priority": 1,
            "project_id": "2322793986",
            "responsible_uid": null,
            "section_id": "138240553",
            "sync_id": null,
            "updated_at": "2023-11-01T19:52:38Z",
            "user_id": "46873680"
          }
        ],
        "sections": [
          {
            "added_at": "2023-11-01T13:53:12.936599Z",
            "archived_at": null,
            "collapsed": false,
            "id": "138441573",
            "is_archived": false,
            "is_deleted": false,
            "name": "Tasks 🛠",
            "project_id": "2322793986",
            "section_order": 1,
            "sync_id": null,
            "user_id": "46873680"
          },
          {
            "added_at": "2023-10-30T11:55:03.014306Z",
            "archived_at": null,
            "collapsed": false,
            "id": "138240553",
            "is_archived": false,
            "is_deleted": false,
            "name": "Routines 🔁",
            "project_id": "2322793986",
            "section_order": 2,
            "sync_id": null,
            "user_id": "46873680"
          },
          {
            "added_at": "2023-10-30T11:55:03.333344Z",
            "archived_at": null,
            "collapsed": false,
            "id": "138240554",
            "is_archived": false,
            "is_deleted": false,
            "name": "Inspiration ✨",
            "project_id": "2322793986",
            "section_order": 3,
            "sync_id": null,
            "user_id": "46873680"
          }
        ]
      }
    }
  }
};

(() => {
  let elem = document.createElement('todoist-kanban-card')
  elem.config = mockConfig;
  elem.hass = mockHass;

  let card = document.getElementById("renderer");
  
  
  card.appendChild(elem);
  
  setTimeout(() => {
    let lnk = document.createElement("link");
    lnk.rel = "stylesheet";
    lnk.href = "ha-card.css";
    
    elem.shadowRoot.insertBefore(lnk, elem.shadowRoot.firstChild)
  }, 1000);
})();
