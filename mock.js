(() => {
    let elem = document.createElement('todoist-kanban-card')
    elem.config =  { "entity": "my-entity" };
    elem.hass = {"states": {"entity": "on"}};
    
    let card = document.getElementById("ha-card");
    card.appendChild(elem);
})();
