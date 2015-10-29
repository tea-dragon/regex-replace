var ruleSet;

chrome.storage.sync.get(null, function (data) {
  if (typeof data.rules === 'undefined') {
    chrome.storage.sync.set({
      'rules': []
    });

    ruleSet = [];
  }
  else{
    ruleSet = data.rules;
  }

  if (typeof data.regexStatus === 'undefined') {
    chrome.storage.sync.set({
      'regexStatus': 1
    });
    startObserver(document.body, ruleSet);
  }
  else {
    if (parseInt(data.regexStatus)) {
      startObserver(document.body, ruleSet);
    }
  }
});

chrome.storage.sync.get('regexStatus', function (data) {
  if (typeof data.regexStatus === 'undefined') {
    chrome.storage.sync.set({
      'regexStatus': 1
    });
    chrome.storage.sync.set({
      'rules': [{
        "key": Math.floor((Math.random() * 99999) + 10000),
        "searchString": "searchString",
        "replaceString": "replaceString"
      }]
    });
    startObserver(document.body, ruleSet);
  }
  else {
    if (parseInt(data.regexStatus)) {
      startObserver(document.body, ruleSet);
    }
  }
});

// mostly from: http://stackoverflow.com/a/5905413

// Reusable generic function
function surroundInElement(el, regex, replaceString, surrounderCreateFunc) {
  // script and style elements are left alone
  if (!/^(script|style|A)$/.test(el.tagName)) {
    el.setAttribute("regexed", "scanned");
    var child = el.lastChild;
    while (child) {
      //if (child.nodeType == 1 && (child.childNodes.length > 1 && !child.hasAttribute("regexed"))) {
      if (child.nodeType == 1) {
        surroundInElement(child, regex, replaceString, surrounderCreateFunc);
      } else if (child.nodeType == 3) {
        surroundMatchingText(child, regex, replaceString, surrounderCreateFunc);
      }
      child = child.previousSibling;
    }
  }
}

// Reusable generic function
function surroundMatchingText(textNode, regex, replaceString, surrounderCreateFunc) {
  var parent = textNode.parentNode;
  var result, surroundingNode, matchedTextNode, matchLength, matchedText;
  while ( textNode && (result = regex.exec(textNode.data)) ) {
    matchedTextNode = textNode.splitText(result.index);
    matchedText = result[0];
    matchLength = matchedText.length;
    textNode = (matchedTextNode.length > matchLength) ? matchedTextNode.splitText(matchLength) : null;
    // Ensure searching starts at the beginning of the text node
    regex.lastIndex = 0;
    surroundingNode = surrounderCreateFunc(matchedTextNode.cloneNode(true), regex, replaceString);
    parent.insertBefore(surroundingNode, matchedTextNode);
    parent.removeChild(matchedTextNode);
    parent.setAttribute("regexed", "child modified");
  }
}

function splitAndLink(matchedTextNode, regex, replaceString) {
  var linkAddress = matchedTextNode.data.replace(regex, replaceString);
  var el = document.createElement("a");
  el.href = linkAddress;
  //el.style.color = "#b58900";
  el.setAttribute("regexed", "replacement link");
  el.appendChild(matchedTextNode);
  return el;
}

// The main function
function wrapWords(container, ruleSet) {
  for (var i = 0, len = ruleSet.length; i < len; ++i) {
    var searchRegex = new RegExp(ruleSet[i].searchString, 'g');
    var replaceString = ruleSet[i].replaceString;
    surroundInElement(container, searchRegex, replaceString, splitAndLink);
  }
}

var observer;
var started = false;
function startObserver(node, ruleSet) {
  if (started) {
    return;
  }
  started = true;
  observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        wrapWords(mutation.target, ruleSet);
      } else if (mutation.type === "characterData") {
        if (mutation.target.parentNode) {
          wrapWords(mutation.target.parentNode, ruleSet);
        }
      }
    });
  });
  var config = { subtree: true, childList: true, characterData: true };
  observer.observe(node, config);
  // initial sweep
  wrapWords(node, ruleSet);
}

// for future use
function replaceLink(match, package, clazz, method, line, offset, string) {
  package = package.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  var p1b = package.split('.').join("/");
  var linkText = clazz;
  if (line) { linkText += line; }
  return "/?message=" + p1b + linkText;
}

function linkFiles (text) {
  text = text.replace(/([a-z][\w.<>]+\.)*([A-Z][\w<>]+)(\.[a-z][\w<>]+)?(?:\(\w+)?((?:.java)?:\d+)?.*$/, this.replaceLink);
  return text;
}
