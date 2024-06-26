import * as Mastodon from 'tsl-mastodon-api';
const mastodon = new Mastodon.API({access_token: 'PRZhmwmS5fpkXo442UE8SGHv8TL7XOiqjhpOh49heb0', api_url: 'https://mastodon.social/api/v1/'}); // access the Mastodon API using the access token.

/*
	getPostText():

	This function performs a Mastodon API GET request to get the n most recent tweets created by Walt Ruff. Using this, the function formats these strings down into the desired plaintext of a Bluesky post, stripping out all of the unnecessary HTML tag notation and handling formatting such that the text is compatible with Bluesky.

	args: None

	returns: A string representing the desired text of the Bluesky posts we want to create. Text for different posts are delimited by \/ characters. 
*/
export default async function getPostText() 
{
	const limitVal = 16; // The number of posts to get from Mastodon.
	var pReg = new RegExp("</p><p>", "g"); // A regex to deal with <p></p>. This should create a new section in the text, which we do via 2 line breaks.
	var brReg = new RegExp("<br>", "g"); // A regex to deal with <br>. This should go to the next line, which we do via a line break. 
	var quoteReg = new RegExp(`\\\\"`, "g"); // A regex to deal with \". This should be replaced with a " value with no \.
	var andReg = new RegExp("&amp;", "g"); // A regex to deal with &amp;. This should be replaced with &.
	var tagReg = new RegExp("<(:?[^>]+)>", "g"); // A general regex for HTML. Used to get the plaintext value of the mastodon post without tag notation.
	var twitterReg = new RegExp("@twitter.com", "g"); // A regex to deal with @twitter.com. Should be deleted.
	var canesReg = new RegExp("@Canes@sportsbots.xyz", "g"); // A regex to deal with Canes's @. Should be replaced with the bot's @.
	var sportsBotsReg = new RegExp("@sportsbots.xyz", "g");
	var invalidLinkReg = new RegExp("\\S*(\\.com|\\.ca|\\.org|\\.net)\\S*(…|\\.\\.\\.)", "g");
	var logoReg = new RegExp("&nbsp;", "g"); // A regex to deal with &nbsp;. Should be deleted.
	var awaitTweet1 = await mastodon.getStatuses("109718180887288386", {'limit':limitVal/2}); //Use the Mastodon API to get a specified number of recent posts from the Mastodon API.
	var awaitTweet2 = await mastodon.getStatuses("109739571912623349", {'limit':limitVal/2}); //Use the Mastodon API to get a specified number of recent posts from the Mastodon API.
	var string1 = JSON.stringify(awaitTweet1); // Convert the post into a JSON string.
	var string2 = JSON.stringify(awaitTweet2); // Convert the post into a JSON string.
	var objJSON1 = JSON.parse(string1)["json"]; // Convert the JSON string back to a JSON object. Kinda silly, but it doesn't work otherwise. 
	var objJSON2 = JSON.parse(string2)["json"]; // Convert the JSON string back to a JSON object. Kinda silly, but it doesn't work otherwise. 
	var objJSON = objJSON1.concat(objJSON2);
	
	var content1 = [];
	var content2 = [];

	for (let i = 0; i < limitVal/2; i++) // Iterate over all the posts we collected using the Mastodon API. 
	{
		content1[i] = JSON.stringify(objJSON1[i]["content"]);
		content2[i] = JSON.stringify(objJSON2[i]["content"]);
	}

	var stringArr = []; // Initialize an empty array that we will store the regexed plaintexts in.
	var urlArr = [];
	var altTextArr = [];
	var cardArr = [];
	for (let i = 0; i < limitVal; i++) // Iterate over all the posts we collected using the Mastodon API. 
	{
		var postUrlArr = [];
		var postAltTextArr = [];
		for (let j = 0; j < 4; j++)
		{	
			if (objJSON[i]["media_attachments"][j] != undefined)
			{
				if (objJSON[i]["media_attachments"][j]["type"] == "image")
				{
					postUrlArr.push(objJSON[i]["media_attachments"][j]["url"]);
				}
				else if (objJSON[i]["media_attachments"][j]["type"] == "gifv" || objJSON[i]["media_attachments"][j]["type"] == "video")
				{
					postUrlArr.push(objJSON[i]["media_attachments"][j]["preview_url"]);
				}
				else
				{
					postUrlArr.push("None");
				}

				if (objJSON[i]["media_attachments"][j]["type"] == "gifv")
				{
					postAltTextArr.push("This is a thumbnail from an animated GIF on Twitter, because Bluesky does not currently have GIF support.")
				}
				else if (objJSON[i]["media_attachments"][j]["type"] == "video")
				{
					postAltTextArr.push("This is a thumbnail from a video on Twitter, because Bluesky does not currently have video support.")
				}
				else if (objJSON[i]["media_attachments"][j]["description"] == null)
				{
					postAltTextArr.push("None");
				}
				else
				{
					postAltTextArr.push(objJSON[i]["media_attachments"][j]["description"]);
				}
			}
			else
			{
				postUrlArr.push("None");
				postAltTextArr.push("None");
			}
		}
		var postUrl = postUrlArr.join("!^&");
		var postAltText = postAltTextArr.join("!^&");
		urlArr.push(postUrl);
		altTextArr.push(postAltText);



		var contentJSON = objJSON[i]["content"]; // Filter through all the values of the JSON object, to get just the content of post i. 
		var contentString = JSON.stringify(contentJSON); // Convert the content of the post into a JSON string.
		var label = "";
		if (content1.includes(contentString))
		{
			label = "WOJ: ";
		}
		else
		{
			label = "SHAMS: ";
		}
		contentString = contentString.slice(1,-1); // Remove the quotation marks.
		contentString = label + contentString;
		contentString = contentString.replace(logoReg, "").replace(twitterReg, "").replace(canesReg, "notcanes.bsky.social").replace(sportsBotsReg, "").replace(quoteReg, `"`).replace(andReg, "&").replace(pReg, "\n\n").replace(brReg, "\n").replace(tagReg, ""); //Use the ", &, <p>, and <br> regexes to apply appropriate formatting. Then use the general regex to remove the HTML formatting from the mastodon post. 

		if (objJSON[i]["card"] != null)
		{
			contentString = contentString.replace(invalidLinkReg, objJSON[i]["card"]["url"]);
			var postCardArr = [];
			if (objJSON[i]["card"]["url"] != null)
			{
				postCardArr.push(objJSON[i]["card"]["url"]);
			}
			else
			{
				postCardArr.push("None");
			}
			if (objJSON[i]["card"]["title"] != null)
			{
				postCardArr.push(objJSON[i]["card"]["title"]);
			}
			else
			{
				postCardArr.push("None");
			}
			if (objJSON[i]["card"]["description"] != null)
			{
				postCardArr.push(objJSON[i]["card"]["description"]);
			}
			else
			{
				postCardArr.push("None");
			}
			if (objJSON[i]["card"]["image"] != null)
			{
				postCardArr.push(objJSON[i]["card"]["image"]);
			}
			else
			{
				postCardArr.push("None");
			}
			var postCard = postCardArr.join("!^&");
			cardArr.push(postCard);
		}
		else
		{
			cardArr.push("None");
		}

		stringArr.push(contentString); // Add the regexed content to the array of plaintexts.
	}
	var urls = urlArr.join("@#%");
	var strings = stringArr.join("@#%"); // Turn the string array into a single string by joining them with a \/ delimiter. This will be undone when used by bot functions. 
	var alts = altTextArr.join("@#%"); 
	var cards = cardArr.join("@#%");
	var urlsStringsAltsCardsArr = [urls, strings, alts, cards];
	var urlsStringsAltsCards = urlsStringsAltsCardsArr.join("~~~");
	return urlsStringsAltsCards; // Return this singular concatenated string. 
}
