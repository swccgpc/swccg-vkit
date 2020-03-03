var MARGIN_LEFT = 0.35;
var MARGIN_TOP = 0.35;

var MAX_PAGE_BOTTOM = 11.0 - MARGIN_LEFT;
var MAX_PAGE_RIGHT = 8.5 - MARGIN_TOP;

var CARD_WIDTH = 2.49;

var spacingOptions = {
  horizontalSpacing: 0,
  verticalSpacing: 0,
  horizontalSpacingInches: 0,
  verticalSpacingInches: 0
};

var matchingCards = [];
var cardsForPdf = [];
var printedCards = [];

console.log("Vkit Verison 1.2");

function popuplateSpacingFields() {
  document.getElementById("inputHorizontalSpacing").value = spacingOptions.horizontalSpacing;
  document.getElementById("inputVerticalSpacing").value = spacingOptions.verticalSpacing;
}

function getNewSpacingOptions() {
  // First, get the new spacing options (if they exist)
  var horizontalSpacing = document.getElementById("inputHorizontalSpacing").value;
  var verticalSpacing = document.getElementById("inputVerticalSpacing").value;

  var parsedHorizontal = parseInt(horizontalSpacing);
  var parsedVertical = parseInt(verticalSpacing);

  if (isNaN(parsedHorizontal) || isNaN(parsedVertical)) {
    alert("The spacing fields contains a invalid value. Please make sure to use whole numbers (0, 1, 2, etc)");
    return false;
  }

  spacingOptions.horizontalSpacing = parsedHorizontal;
  spacingOptions.verticalSpacing = parsedVertical;
  spacingOptions.horizontalSpacingInches = parsedHorizontal / 200;
  spacingOptions.verticalSpacingInches = parsedVertical / 200;

  return true;
}

function showPrintProgress() {
  jQuery('#printProgressObj').css('display', 'block');
}

function hidePrintProgress() {
  jQuery('#printProgressObj').css('display', 'none');
}

function expandCollapseSpacingOptions() {
  var displayMode = jQuery('#printOptionsObj').css('display');
  if (displayMode == "none") {
      jQuery('#printOptionsObj').css('display', 'block');
  } else {
      jQuery('#printOptionsObj').css('display', 'none');
  }
}

function expandCollapseInstructions() {
    var displayMode = jQuery('#instructionsObj').css('display');
    if (displayMode == "none") {
        jQuery('#instructionsObj').css('display', 'block');
    } else {
        jQuery('#instructionsObj').css('display', 'none');
    }
}

function getFilterText() {
  var textObj = jQuery('#filterText');
  return textObj.val();
}

function updateMatchingCards() {
    var i = 0;

    var filterText = getFilterText();
    console.log("Filter Change!: " + filterText);


    matchingCards.length = 0;
    for (i = 0; i < allCardNames.length; i++) {
        var matches = false;

        var lowercaseFilterText = filterText.toLowerCase();

        if ("" === lowercaseFilterText) {
            matches = true;
        } else if (-1 != allCardNames[i].toLowerCase().indexOf(lowercaseFilterText)) {
            matches = true;
        }

        if (matches) {
            matchingCards.push(allCardNames[i]);
        }
    }

    jQuery('#selectAdds').find('option')
      .remove();

    for (i = 0; i < matchingCards.length; i++) {
        var match = matchingCards[i];
        console.log("Add card: " + match);
        jQuery('#selectAdds').append('<option value="' + match + '">' + match + '</option>');
    }

}

function queueFilterChange() {
    setTimeout(filterChanged, 250);
}

function filterChanged() {
    updateMatchingCards();
}

function addSelectedCards(isWhiteBorder) {

  // Try to add the cards next to it's duplicates (if exist)
  jQuery("#selectAdds").find(":selected").each(function() {
      var cardToAdd = jQuery(this).val();

      if (isWhiteBorder) {
          cardToAdd += " (WB)";
      }

      var added = false;
      for (var j = 0; j < cardsForPdf.length; j++) {
          if (cardsForPdf[j] == cardToAdd) {
              cardsForPdf.splice(j, 0, cardToAdd);
              added = true;
              break;
          }
      }

      if (!added) {
          cardsForPdf.push(cardToAdd);
      }

      jQuery('#selectedRemoves').find('option')
        .remove();

      for (var i = 0; i < cardsForPdf.length; i++) {
          var match = cardsForPdf[i];
          console.log("Add card: " + match);
          jQuery('#selectedRemoves').append('<option value="' + match + '">' + match + '</option>');
      }

  });

}

function removeSelectedCards() {
    jQuery("#selectedRemoves").find(":selected").each(function() {
        var cardToRemove = jQuery(this).val();
        for (var j = 0; j < cardsForPdf.length; j++) {
            if (cardsForPdf[j] == cardToRemove) {
                jQuery(this).remove();
                cardsForPdf.splice(j, 1);
                break;
            }
        }
    });
}


function convertImgToBase64(isWhiteBorder, url, callback) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  img = document.createElement('img');
  img.crossOrigin = "Anonymous";
  img.src = url;
  img.onload = function() {
    canvas.height = img.height;
    canvas.width = img.width;
    var context = canvas.getContext('2d');

    context.drawImage(img, 0, 0);

    if (isWhiteBorder) {
        convertCanvasToWhiteBorder2(canvas);
    }

    var dataURL = canvas.toDataURL('image/jpeg');
    var aspectRatio = canvas.height / canvas.width;
    callback(dataURL, aspectRatio);
    canvas = null;
  };
  img.onerror = function() {
      console.log("Failed ot open image: " + url);
      callback(null);
  };

}

function sortCards(originalList, fullTemplates, halfSlips) {
  for (var i = 0; i < originalList.length; i++) {
      var card = originalList[i];
      if (card.aspectRatio > 1) {
          // Card is taller than wide
          fullTemplates.push(card);
      } else {
          halfSlips.push(card);
      }
  }
}

function setPrintPoint(pointObj, top, left, bottom, right) {
  pointObj.top = top;
  pointObj.left = left;
  pointObj.bottom = bottom;
  pointObj.right = right;
}

function printCards(doc, cardsToPrint, lastPrintPoint) {

  for (var i = 0; i < cardsToPrint.length; i++) {
      var card = cardsToPrint[i];

      var calculatedHeight = CARD_WIDTH * card.aspectRatio;
      //console.log("calculatedHeight: " + calculatedHeight);

      var nextTop = lastPrintPoint.top;
      var nextLeft = lastPrintPoint.right;
      var addedPageOrRow = false;

      // If this card exceeds the bottom, add a new page
      if ((nextTop + calculatedHeight) > MAX_PAGE_BOTTOM) {
          // Won't fit on page!  Add a new page!
          //console.log("Next bottom would have been off-page. Figuring out to adapt!");
          doc.addPage();
          addedPageOrRow = true;
          nextTop = MARGIN_TOP;
          nextLeft = MARGIN_LEFT;
          //setPrintPoint(lastPrintPoint, MARGIN_TOP, MARGIN_LEFT, MARGIN_TOP, MARGIN_LEFT);
      }

      // If this card will exceed the width, add a new row OR a new page if needed
      if ((nextLeft + CARD_WIDTH) > MAX_PAGE_RIGHT) {
          //console.log("Next right edge would have been off screen. Figuring out how to adapt!");
          nextTop = lastPrintPoint.bottom;
          nextTop += spacingOptions.verticalSpacingInches;

          // Need to add a new row
          if ((nextTop + calculatedHeight) < MAX_PAGE_BOTTOM) {
              // Card will fit in the page in the next rows
              //console.log("Adding new row!");
              nextTop = lastPrintPoint.bottom;
              nextTop += spacingOptions.verticalSpacingInches;
              nextLeft = MARGIN_LEFT;
              addedPageOrRow = true;
          } else {
              // Need a whole new page
              //console.log("Adding new page!");
              doc.addPage();
              nextTop = MARGIN_TOP;
              nextLeft = MARGIN_LEFT;
              addedPageOrRow = true;
          }
      } else {
          // Card will fit in this row on this page!  No adjustments needed.
      }

      if (card.dataUrl !== null) {
          doc.addImage(card.dataUrl, 'jpeg', nextLeft, nextTop, CARD_WIDTH, calculatedHeight);
      }

      // 'bottom' of last card can't be any higher than the lowest card in the current row
      var bottomOfLastPrintedCard = nextTop + calculatedHeight;
      if (!addedPageOrRow) {
          bottomOfLastPrintedCard = Math.max(bottomOfLastPrintedCard, lastPrintPoint.bottom);
      }
      // Adjust the print-point based on the card we just added
      setPrintPoint(lastPrintPoint, nextTop, nextLeft,
                                    bottomOfLastPrintedCard, nextLeft + CARD_WIDTH + spacingOptions.horizontalSpacingInches);

  }

}


function generatePdf() {

    if (!getNewSpacingOptions()) {
      return;
    }

    showPrintProgress();

    console.log("Spacing options are at: " + spacingOptions.horizontalSpacingInches  + " V: " + spacingOptions.verticalSpacingInches);

    var doc = new jsPDF('portrait', 'in', [11, 8.5]);

    var cardsWithSizes = [];

    function addNextCard(currentCardIndex) {

        var progressElement = document.getElementById("progressText");
        if (progressElement) {
          progressElement.innerHTML = "Adding card: " + currentCardIndex + " of " + cardsForPdf.length;
        }

        if (currentCardIndex == cardsForPdf.length) {

          var halfSlips = [];
          var fullTemplates = [];
          sortCards(cardsWithSizes, fullTemplates, halfSlips);

          var cardsInCurrentRow = 0;
          var rowsPrinted = 0;

          var lastPrintPoint = {
              left: MARGIN_LEFT,
              top: MARGIN_TOP,
              right: MARGIN_LEFT,
              bottom: MARGIN_TOP
          };
          printCards(doc, fullTemplates, lastPrintPoint);
          printCards(doc, halfSlips, lastPrintPoint);

          doc.output('save', 'vkitPdf.pdf');

          hidePrintProgress();

        } else {

          var cardName = cardsForPdf[currentCardIndex];
          var isWhiteBorder = (-1 != cardName.indexOf(" (WB)"));
          var cardPath = allCardImages[cardName];
          console.log("image: " + cardPath );

          var imgData = convertImgToBase64(isWhiteBorder, cardPath, function(dataUrl, aspectRatio) {

              cardsWithSizes.push( {
                cardPath: cardPath,
                dataUrl: dataUrl,
                aspectRatio: aspectRatio
              });

              addNextCard(currentCardIndex+1);
          });
        }
    }

    addNextCard(0);
}


var allCardNames  = [];
var allCardImages = [];

jQuery(document).ready(function() {

  console.log("After Loaded");

    jQuery.getJSON('allCards.json', function(data) {
      allCardNames  = data.allCardNames;
      allCardImages = data.allCardImages;
      console.log("allCardNames:", JSON.stringify(allCardNames));
      popuplateSpacingFields();
      updateMatchingCards();
    }); // jQuery.getJSON('allCards.json', function(data)

});
