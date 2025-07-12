import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart' hide Text;
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class AskQuestionScreen extends StatefulWidget {
  const AskQuestionScreen({super.key});

  @override
  State<AskQuestionScreen> createState() => _AskQuestionScreenState();
}

class _AskQuestionScreenState extends State<AskQuestionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _quillController = QuillController.basic();
  final List<String> _tags = [];
  bool _isSubmitting = false;
  final QuillController _controller = QuillController.basic();
  final FocusNode _focusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _titleController.dispose();
    _quillController.dispose();
    super.dispose();
  }

  Future<void> _submitQuestion() async {
    if (!_formKey.currentState!.validate()) return;
    if (_tags.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one tag')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final content = _quillController.document.toPlainText();

      if (content.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Please add some content to your question')),
        );
        return;
      }

      final token = await authProvider.idToken;
      if (token == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Authentication token not available')),
        );
        return;
      }
      await ApiService.createQuestion(
        title: _titleController.text.trim(),
        content: content,
        tags: _tags,
        token: token,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Question posted successfully!')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error posting question: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _addTag(String tag) {
    if (tag.isNotEmpty && !_tags.contains(tag)) {
      setState(() => _tags.add(tag));
    }
  }

  void _removeTag(String tag) {
    setState(() => _tags.remove(tag));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ask Question'),
        actions: [
          TextButton(
            onPressed: _isSubmitting ? null : _submitQuestion,
            child: _isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Post'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Title Field
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title',
                hintText: 'What\'s your question? Be specific.',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a title';
                }
                if (value.trim().length < 10) {
                  return 'Title must be at least 10 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),

            // Content Editor
            const Text(
              'Content',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            // Container(
            //   decoration: BoxDecoration(
            //     border: Border.all(color: Colors.grey),
            //     borderRadius: BorderRadius.circular(4),
            //   ),
            //   child: QuillEditor(
            //     controller: _quillController,
            //     scrollController: ScrollController(),
            //     focusNode: FocusNode(),
            //     placeholder: 'Describe your question in detail...',
            //   ),
            // ),
            // const SizedBox(height: 8),
            // QuillToolbar(controller: _quillController),
            QuillToolbar.simple(
              configurations: QuillSimpleToolbarConfigurations(
                controller: _controller,
                color: Colors.grey.shade100,
                showBoldButton: true,
                showSmallButton: false,
                showDirection: false,
                showDividers: false,
                showJustifyAlignment: false,
                showLeftAlignment: false,
                showLineHeightButton: false,
                showRightAlignment: false,
                showCenterAlignment: false,
                showFontFamily: false,
                showStrikeThrough: false,
                showColorButton: false,
                showBackgroundColorButton: false,
                showHeaderStyle: false,
                showListNumbers: false,
                showListBullets: false,
                showListCheck: false,
                showCodeBlock: false,
                showQuote: false,
                showIndent: false,
                showLink: false,
                showUndo: false,
                showRedo: false,
                showAlignmentButtons: false,
                showClipboardCopy: false,
                showClipboardCut: false,
                showClipboardPaste: false,
                showSearchButton: false,
                showClearFormat: false,
                showSuperscript: false,
                showSubscript: false,
                showInlineCode: false,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              height: 300,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(4),
              ),
              child: QuillEditor.basic(
                // controller: _controller,
                focusNode: _focusNode,
                scrollController: _scrollController,
                configurations: QuillEditorConfigurations(
                  padding: const EdgeInsets.all(10),
                  controller: _controller,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Tags
            const Text(
              'Tags',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            // Tag Input
            TextField(
              decoration: const InputDecoration(
                labelText: 'Add tags',
                hintText: 'Enter a tag and press Enter',
                border: OutlineInputBorder(),
              ),
              onSubmitted: _addTag,
            ),
            const SizedBox(height: 12),

            // Selected Tags
            if (_tags.isNotEmpty)
              Wrap(
                spacing: 8,
                children: _tags
                    .map((tag) => Chip(
                          label: Text(tag),
                          onDeleted: () => _removeTag(tag),
                          backgroundColor:
                              const Color(0xFF0D47A1).withOpacity(0.1),
                          labelStyle: const TextStyle(color: Color(0xFF0D47A1)),
                        ))
                    .toList(),
              ),
            const SizedBox(height: 24),

            // Guidelines
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Writing a good question',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '• Be specific and clear\n'
                      '• Include relevant code examples\n'
                      '• Describe what you\'ve tried\n'
                      '• Add appropriate tags',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
