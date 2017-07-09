def my_grid():
    return indent('div class="grid_div"', """<h1>My Grid</h1>
"""+grid("click_mine"))

def ai_grid():
    return indent('div class="grid_div"', """<h1>AI Grid</h1>
"""+grid("click_bots"))

def grid(command):
    return indent('table class="grid"', thead() + tbody(command))

def thead():
    output = '<th>Grid</th>'
    for x in range(10):
        output += "\n"
        output += '<th>{}</th>'.format(chr(ord("A")+x))
    return indent("thead", indent("tr", output))

def tbody(command):
    output = ""
    for y in range(10):
        output += row(y, command)
    return indent("tbody", output)

def row(y, command):
    output = '<th>{}</th>'.format(y+1)
    for x in range(10):
        output += "\n"
        output += '<td><button id="{0}({1},{2})" onclick="{0}({1},{2})"></button></td>'.format(command, x, y)
    return indent("tr", output)

def dpad():
    output = ""
    for row in (("","up",""),("left","","right"),("","down","")):
        output += dpad_row(row)
    return indent('div id="dpad_container"', indent('table id="dpad"', output))

def dpad_row(row):
    output = ""
    for item in row:
        tag = ""
        if item != "":
            tag = '<input type="radio" name="direction" value="{0}">&{0[0]}arr;'.format(item)
        output += indent("td", tag)
    return indent("tr", output)

def stage_header():
    tag = 'h1 id="stage_header"'
    return opener(tag)+closer(tag)+opener("br")+"\n"

def indent(tag, content):
    output = ""
    for line in content.strip("\n").split("\n"):
        output += "  {}\n".format(line)
    return opener(tag) + output + closer(tag)

def opener(tag):
    return "<"+tag+">\n"

def closer(tag):
    return "</"+tag.split(" ")[0]+">\n"

with open("template.html") as template, open("bettership.html", "w") as outfile:
    body = indent("body", stage_header()+my_grid()+dpad()+ai_grid())
    outfile.write(template.read(-1).replace("<body></body>\n", body))
