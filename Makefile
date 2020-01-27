FILES=manifest.json icons/icon-256.png stuff-your-opinion.js
FIREFOX_OUT=stuff-your-opinion.xpi

all: firefox

clean:
	rm -f $(FIREFOX_OUT)

firefox: $(FIREFOX_OUT)

.PHONY: all clean firefox


$(FIREFOX_OUT): $(FILES)
	zip $@ $^
